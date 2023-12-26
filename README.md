# Getting Started
- Hit run
- Edit [runUIBuilder.ts](#src/runUIBuilder.ts) and watch it live update!

# Learn More

You can learn more in the [Base Extension Development Guide](https://bytedance.feishu.cn/docx/VxhudDXbyo1V7jxAcTbctJQ5nvc) or [多维表格扩展脚本开发指南](https://bytedance.feishu.cn/docx/HazFdSHH9ofRGKx8424cwzLlnZc).

## Install packages

Install packages in Shell pane or search and add in Packages pane.


## TODO
- [x] 查找时候转菊花的文案改一下，应该是查找中
- [x] 如果查找到的记录为空，应该打印的时候不打印表头，只打印一行提示
- [x] 点击一键格式化的时候，表格不应该消失
- [x] 表格的文本优化与国际化
- [x] 点击查找之前不能点击一键优化按钮
- [x] 未发现问题的时候，应该也无法点击一键优化按钮
- [x] 没有要优化的内容的时候，点击优化按钮，提示要仍然存在
- [x] 每次点击 find 按钮的时候，重置 recordsMap 和 isDataAvailable 
- [x] 展示查找结果的时候，分字段展示，并且写出来找到的结果数量
- [ ] 表格里最后一列加个单独优化的按钮 -- 等一个 uiBuilder.table
- [ ] 表格怎么这么丑 -- 等一个 uiBuilder.table