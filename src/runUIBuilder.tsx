import {
  FieldType,
  // IRecord,
  IOpenSegment,
  ITable,
  ITextField,
  UIBuilder,
} from "@lark-base-open/js-sdk";
import { UseTranslationResponse } from "react-i18next";

export default async function main(
  uiBuilder: UIBuilder,
  { t }: UseTranslationResponse<"translation", undefined>
) {
  let recordsMap = new Map<
    string,
    { originalText: string; formattedText: string }
  >();
  let findButtonClicked = false; // 跟踪是否点击过查找按钮
  let isDataAvailable = false; // 跟踪查找结果是否为空
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
            { label: t("punctuation_formatting"), value: "punctuation" },
            // 标点符号
            // 对于中文单元格：英文标点转中文标点
            // 对于英文单元格：中文标点转英文标点
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

      // uiBuilder.showLoading(t("processing_data"));

      if (key === t("find_button")) {
        // 重置相关变量
        recordsMap.clear(); // 清空记录映射
        findButtonClicked = true; // 更新查找按钮点击标志
        isDataAvailable = false; // 重置数据可用性标志

        uiBuilder.showLoading(t("finding_data"));
        const recordIdList = await table.getRecordIdList();
        for (const recordId of recordIdList) {
          for (const field of fields) {
            const fieldValueSegments = (await field.getValue(
              recordId
            )) as IOpenSegment[];

            // 确保 fieldValueSegments 不是 null 或 undefined
            if (!fieldValueSegments) {
              // 处理 fieldValueSegments 为 null 或 undefined 的情况
              continue; // 或者采取其他措施
            }

            const originalText = fieldValueSegments
              .map((segment) => segment.text)
              .join("");
            const formattedText = formatText(originalText, formattingMethod);

            if (originalText !== formattedText) {
              const key = `${recordId}-${field.id}`;
              recordsMap.set(key, { originalText, formattedText });
            }
          }
        }
        isDataAvailable = recordsMap.size > 0; // 更新数据可用性标志
        // 显示需要格式化的记录
        displayRecordsAsTable(recordsMap, uiBuilder, t, table);
        uiBuilder.message.success(t("finding_completed"));
        uiBuilder.hideLoading();
      } else if (key === t("format_button")) {
        // 检查是否点击过查找按钮
        if (!findButtonClicked) {
          uiBuilder.message.error(t("find_button_not_clicked_error")); // 显示错误消息
          return; // 终止处理
        }
        // 重新显示表格
        await displayRecordsAsTable(recordsMap, uiBuilder, t, table);
        // 检查是否有数据可用于格式化
        if (!isDataAvailable) {
          uiBuilder.message.error(t("no_records_found_error")); // 显示错误消息
          return; // 终止处理
        }

        uiBuilder.showLoading(t("processing_data"));
        let count = 0; // 格式化的单元格数量

        for (const [mapKey, { formattedText }] of recordsMap) {
          // 提取 recordId 和 fieldId
          const [recordId, fieldId] = mapKey.split("-");

          // 执行格式化操作...
          if (formattedText !== undefined) {
            const res = await formatRecord(
              recordId,
              fieldId,
              table,
              recordsMap
            );
            count += res ? 1 : 0;
          }
        }

        uiBuilder.message.success(
          `${t("formatting_completed")} ${count} ${t("cells_formatted")}`
        );
        uiBuilder.hideLoading();
      }

      // uiBuilder.hideLoading();
      // uiBuilder.message.success(t("formatting_completed"));
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

// function needsFormatting(recordId: string, fieldId: string, text: string,recordsMap: Map<string, string>): boolean {
//   const formattedText = recordsMap.get(`${recordId}-${fieldId}`);
//   return formattedText !== undefined && formattedText !== text;
// }

// async function displayRecordsAsTable(
//   recordsMap: Map<string, { originalText: string; formattedText: string }>,
//   uiBuilder: UIBuilder,
//   t: Function // 将 t 函数作为参数添加
// ) {
//   // 检查记录是否为空
//   if (recordsMap.size === 0) {
//     uiBuilder.markdown(t("no_records_found")); // 使用传入的 t 函数进行国际化
//     return;
//   }

//   let markdownTable = `| **${t("table_original_content")}** | **${t(
//     "table_formatted_content"
//   )}** |\n| --- | --- |\n`;

//   for (const [key, { originalText, formattedText }] of recordsMap.entries()) {
//     markdownTable += `| ${originalText} | ${formattedText} |\n`;
//   }

//   uiBuilder.markdown(markdownTable);
// }

async function displayRecordsAsTable(
  recordsMap: Map<string, { originalText: string; formattedText: string }>,
  uiBuilder: UIBuilder,
  t: Function,
  table: ITable // 假设的函数来获取 ITable 实例
) {
  if (recordsMap.size === 0) {
    uiBuilder.markdown(t("no_records_found"));
    return;
  }

  const fieldMetaMap = new Map<string, string>(); // 用于存储字段 ID 与名称的映射

  // 获取所有字段的元信息
  for (const [key] of recordsMap.entries()) {
    const fieldId = key.split("-")[1];
    if (!fieldMetaMap.has(fieldId)) {
      const fieldMeta = await table.getFieldMetaById(fieldId);
      fieldMetaMap.set(fieldId, fieldMeta.name);
    }
  }

  // 分字段存储记录
  const fieldWiseRecords = new Map<
    string,
    { key: string; value: { originalText: string; formattedText: string } }[]
  >();

  for (const [key, value] of recordsMap.entries()) {
    const fieldId = key.split("-")[1];
    const fieldName = fieldMetaMap.get(fieldId) || fieldId; // 默认使用 fieldId
  
    // 检查是否已经为该字段名初始化了一个数组，如果没有，则初始化一个空数组
    if (!fieldWiseRecords.has(fieldName)) {
      fieldWiseRecords.set(fieldName, []);
    }
  
    // 此时可以确信 fieldWiseRecords.get(fieldName) 不会是 undefined
    fieldWiseRecords.get(fieldName)!.push({ key, value }); // 使用 "!" 断言非空
  }

  // 为每个字段创建一个表格
  for (const [fieldName, records] of fieldWiseRecords.entries()) {
    // 显示字段名称和结果数量，使用国际化函数 t
    uiBuilder.markdown(
      `**${fieldName} - ${t("number_of_results", { count: records.length })}**`
    );

    let markdownTable = `| **${t("table_original_content")}** | **${t(
      "table_formatted_content"
    )}** |\n| --- | --- |\n`;

    for (const {
      value: { originalText, formattedText },
    } of records) {
      markdownTable += `| ${originalText} | ${formattedText} |\n`;
    }

    uiBuilder.markdown(markdownTable);
  }
}

async function formatRecord(
  recordId: string,
  fieldId: string,
  table: ITable,
  recordsMap: Map<string, { originalText: string; formattedText: string }>
): Promise<boolean> {
  try {
    // 确保使用 await 来处理 Promise
    const field = (await table.getField(fieldId)) as ITextField;

    const textInfo = recordsMap.get(`${recordId}-${fieldId}`);
    if (textInfo && textInfo.formattedText !== undefined) {
      await field.setValue(recordId, textInfo.formattedText);
      return true;
    }
  } catch (error) {
    console.error("Error updating record:", error);
  }

  return false;
}
