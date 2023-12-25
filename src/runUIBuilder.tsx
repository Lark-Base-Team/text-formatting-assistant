import {
  FieldType,
  // IRecord,
  ITable,
  ITextField,
  UIBuilder,
} from "@lark-base-open/js-sdk";
import { UseTranslationResponse } from "react-i18next";

export default async function main(
  uiBuilder: UIBuilder,
  { t }: UseTranslationResponse<"translation", undefined>
) {
  let recordsToFormat: { recordId: string; fieldId: string }[] = []; // 存储需要格式化的记录ID和字段ID
  uiBuilder.markdown(`## ${t("text_formatting_title")}`);
  uiBuilder.markdown(t("text_formatting_description"));
  uiBuilder.form(
    (form) => ({
      formItems: [
        form.tableSelect("table", {
          label: t("select_data_table"),
        }),
        form.fieldSelect("fields", {
          label: t("select_fields_label"),
          sourceTable: "table",
          multiple: true, // Allow multiple selections
          filterByTypes: [FieldType.Text as any], // Only display text fields
        }),
        form.select("formattingMethod", {
          label: t("formatting_method_label"),
          options: [
            { label: t("all_formatting"), value: "all" },
            { label: t("space_formatting"), value: "space" },
            // { label: t("punctuation_formatting_1"), value: "punctuation_1" }, //标点符号（中文标点转英文标点）
            // { label: t("punctuation_formatting_2"), value: "punctuation_2" }, //标点符号（英文标点转中文标点）
            { label: t("punctuation_formatting"), value: "punctuation" },
            //标点符号
            //对于中文单元格：英文标点转中文标点
            //对于英文单元格：中文标点转英文标点
          ],
          defaultValue: "all", // Default selected value
          description: t("formatting_method_description"), // Optional: Add a description or help text
        }),
      ],
      buttons: [t("find_button"), t("format_button")], // Button to submit the form
    }),
    async ({ key, values }) => {
      // uiBuilder.markdown(`你点击了**${key}**按钮`);
      const table = values.table as ITable;
      const fields = values.fields as ITextField[];
      const formattingMethod = values.formattingMethod as string;

      // 检查是否所有必填项都已填写
      if (!table || !fields || !formattingMethod) {
        uiBuilder.message.error(t("form_incomplete_error")); // Display error
        throw new Error(t("form_incomplete_error"));
      }

      uiBuilder.showLoading(t("processing_data"));

      if (key === t("find_button")) {
        recordsToFormat = [];

        const recordIdList = await table.getRecordIdList();
        for (const recordId of recordIdList) {
          for (const field of fields) {
            const fieldValue = await field.getValue(recordId);

            // 检查是否需要格式化并添加到数组
            if (fieldValue && needsFormatting(fieldValue, formattingMethod)) {
              recordsToFormat.push({ recordId, fieldId: field.id });
            }
          }
        }

        // 显示需要格式化的记录
        displayRecordsAsTable(recordsToFormat, uiBuilder);
      } else if (key === t("format_button")) {
        let count = 0; // 格式化的单元格数量

        for (const { recordId, fieldId } of recordsToFormat) {
          // 执行格式化操作...
          const res = await formatRecord(
            recordId,
            fieldId,
            formattingMethod,
            table
          );
          count += res ? 1 : 0;
        }

        uiBuilder.message.success(
          `${t("formatting_completed")} ${count} ${t("cells_formatted")}`
        );
      }

      uiBuilder.hideLoading();
      uiBuilder.message.success(t("formatting_completed"));
    }
  );
}

function formatText(text: string, method: string): string {
  // 如果 text 为空或不是字符串，则返回原始值
  if (typeof text !== "string" || text == null) {
    return text;
  }

  let formattedText = text;

  if (method === "all" || method === "punctuation") {
    const isChinese = isMainlyChinese(text);

    let inQuote = false; // 跟踪双引号的开闭状态
    let inSingleQuote = false; // 跟踪单引号的开闭状态

    if (isChinese) {
      // 英文标点转中文标点
      formattedText = formattedText
        .replace(/,/g, "，")
        .replace(/\./g, "。")
        .replace(/!/g, "！")
        .replace(/\?/g, "？")
        .replace(/:/g, "：")
        .replace(/;/g, "；")
        .replace(/\(/g, "（")
        .replace(/\)/g, "）")
        .replace(/</g, "《")
        .replace(/>/g, "》")
        .replace(/--/g, "——")
        .replace(/"/g, () => {
          inQuote = !inQuote;
          return inQuote ? "“" : "”";
        }) // 英文双引号转中文双引号，考虑开闭引号的不同
        .replace(/'/g, () => {
          inSingleQuote = !inSingleQuote;
          return inSingleQuote ? "‘" : "’";
        }); // 英文单引号转中文单引号，考虑开闭引号的不同
    } else {
      // 中文标点转英文标点
      formattedText = formattedText
        .replace(/，/g, ",")
        .replace(/。/g, ".")
        .replace(/！/g, "!")
        .replace(/？/g, "?")
        .replace(/：/g, ":")
        .replace(/；/g, ";")
        .replace(/‘/g, "'")
        .replace(/’/g, "'")
        .replace(/“/g, '"')
        .replace(/”/g, '"')
        .replace(/（/g, "(")
        .replace(/）/g, ")")
        .replace(/《/g, "<")
        .replace(/》/g, ">")
        .replace(/、/g, ",")
        .replace(/——/g, "--");
    }
  }

  if (method === "all" || method === "space") {
    // 中英文之间添加空格
    formattedText = formattedText.replace(
      /([\u4E00-\u9FA5])([A-Za-z0-9\(\[\{@#])/g,
      "$1 $2"
    );
    formattedText = formattedText.replace(
      /([A-Za-z0-9\.,!@#%?\)\]\}])([\u4E00-\u9FA5])/g,
      "$1 $2"
    );
  }

  return formattedText;
}

function isMainlyChinese(text: string): boolean {
  const chineseCharRegex = /[\u4e00-\u9fff]/;
  let chineseCharCount = 0;
  let nonChineseCharCount = 0;

  for (let i = 0; i < text.length; i++) {
    if (chineseCharRegex.test(text[i])) {
      chineseCharCount++;
    } else {
      nonChineseCharCount++;
    }
  }

  return chineseCharCount > nonChineseCharCount;
}

function needsFormatting(text: string, formattingMethod: string): boolean {
  const formattedText = formatText(text, formattingMethod);
  return formattedText !== text;
}

async function displayRecordsAsTable(
  records: { recordId: string; fieldId: string }[],
  uiBuilder: UIBuilder,
  table: ITable,
  formattingMethod: string
) {
  let markdownTable = `| 原始内容 | 格式化后内容 |\n| --- | --- |\n`;

  for (const { recordId, fieldId } of records) {
    const field = table.getField(fieldId) as ITextField;
    const originalText = await field.getValue(recordId);
    const formattedText = formatText(originalText, formattingMethod);

    markdownTable += `| ${originalText} | ${formattedText} |\n`;
  }

  uiBuilder.markdown(markdownTable);
}
