import {
  FieldType,
  IWidgetField,
  IWidgetTable,
  UIBuilder,
} from "@lark-base-open/js-sdk";
import { UseTranslationResponse } from "react-i18next";

export default async function main(
  uiBuilder: UIBuilder,
  { t }: UseTranslationResponse<"translation", undefined>
) {
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
            { label: t("space_formatting"), value: "space" },
            { label: t("punctuation_formatting_1"), value: "punctuation_1" }, //标点符号（中文标点转英文标点）
            { label: t("punctuation_formatting_2"), value: "punctuation_2" }, //标点符号（英文标点转中文标点）
          ],
          defaultValue: "space", // Default selected value
          description: t("formatting_method_description"), // Optional: Add a description or help text
        }),
      ],
      buttons: [t("format_button")], // Button to submit the form
    }),
    async ({ values }) => {
      const table = values.table as IWidgetTable;
      const fields = values.fields as IWidgetField[];
      const formattingMethod = values.formattingMethod as string;

      // 检查是否所有必填项都已填写
      if (!table || !fields || !formattingMethod) {
        uiBuilder.message.error(t("form_incomplete_error")); // Display error
        throw new Error(t("form_incomplete_error"));
      }

      uiBuilder.showLoading(t("processing_data"));

      // 针对每个字段进行操作
      for (let field of fields) {
        const records = await field.getFieldValueList();
        for (let i = 0; i < records.length; i += 5000) {
          // 每次处理最多 5000 条记录
          const recordsToUpdate = records.slice(i, i + 5000).map((record) => {
            // 修改记录中每个元素的text部分
            const newValues = record.value.map((item) => {
              let newItem = { ...item }; // 复制元素以避免直接修改原始数据
              if ("text" in newItem) {
                const originalText = newItem.text;
                const formattedText = formatText(
                  originalText,
                  formattingMethod
                );
                newItem.text = formattedText;
              }
              return newItem;
            });

            return {
              recordId: record.record_id,
              fields: {
                [field.id]: newValues,
              },
            };
          });

          // 使用 setRecords 方法批量更新该字段的一批记录
          if (recordsToUpdate.length > 0) {
            const res = await table.setRecords(recordsToUpdate);
            // console.log(res); // 打印被修改记录的 id 列表
          }
        }
      }

      uiBuilder.hideLoading();
      uiBuilder.message.success(t("formatting_completed"));
    }
  );
}

function formatText(text, method) {
  // 确保 text 是字符串类型，同时处理 null 和 undefined
  if (typeof text !== "string" || text == null) {
    text = String(text || "");
  }

  if (method === "space") {
    // 中英文之间添加空格的规则
    text = text.replace(/([\u4E00-\u9FA3])([A-Za-z0-9\(\[\{@#])/g, "$1 $2");
    text = text.replace(
      /([A-Za-z0-9\.,!@#%?\)\]\}])([\u4E00-\u9FA3])/g,
      "$1 $2"
    );
  } else if (method === "punctuation_1") {
    // 中文标点转英文标点
    text = text
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
  } else if (method === "punctuation_2") {
    // 英文标点转中文标点
    text = text
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
      .replace(/--/g, "——");

    // 英文双引号转中文双引号，考虑开闭引号的不同
    let inQuote = false;
    text = text.replace(/"/g, () => {
      inQuote = !inQuote;
      return inQuote ? "“" : "”";
    });
    // 英文单引号转中文单引号，考虑开闭引号的不同
    let inSingleQuote = false;
    text = text.replace(/'/g, () => {
      inSingleQuote = !inSingleQuote;
      return inSingleQuote ? "‘" : "’";
    });
  }

  return text;
}
