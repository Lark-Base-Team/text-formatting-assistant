const resources = {
  zh: {
    translation: {
      text_description:
        "📝 文本字段的格式优化，包括在英文或数字与中文之间添加空格、中英文标点的统一。",
      text_description_2:
        "👉 [演示与使用说明](https://fexakcngwi.feishu.cn/docx/CqULdiaBXoFEiMxrI2rcK71Dn7d)",
      select_data_table: "选择数据表",
      select_fields_label: "要优化的字段（文本）",
      formatting_method_label: "优化方式",
      field_select_placeholder: "请选择要优化的文本字段",
      all_formatting: "全部优化",
      space_formatting: "仅空格格式",
      punctuation_formatting: "仅标点符号",
      find_button: "查找",
      format_button: "一键优化",
      formatting_completed: "完成：{{count}} 个单元格已优化",
      finding_completed: "查找完成",
      form_incomplete_error: "表单未填写完整",
      processing_data: "优化中",
      finding_data: "查找中",
      no_records_found: "未发现格式问题，太棒了！",
      find_button_not_clicked_error: "请先「查找」",
      no_records_found_error: "没有可优化的格式问题",
      table_original_content: "当前",
      table_formatted_content: "建议",
      number_of_results: "共找到 {{count}} 个优化建议",
    },
  },
  en: {
    translation: {
      text_formatting_title: "Text Formatting Assistant",
      text_formatting_description:
        "This plugin offers formatting optimization for text fields, including adding spaces between English/numbers and Chinese, and converting between Chinese and English punctuation.",
      select_data_table: "Select Data Table",
      select_fields_label: "Fields to Optimize (Text)",
      formatting_method_label: "Method of Optimization",
      field_select_placeholder: "Please select the Text fields to optimize",
      space_formatting:
        "Space Formatting: Add spaces between English/numbers and Chinese characters",
      punctuation_formatting_1:
        "Punctuation: Convert Chinese punctuation to English",
      punctuation_formatting_2:
        "Punctuation: Convert English punctuation to Chinese",
      format_button: "Optimize with One Click",
      formatting_completed: "Text Optimization Completed",
      form_incomplete_error: "Form Incomplete",
      processing_data: "Optimizing...",
    },
  },
};

export default resources;
