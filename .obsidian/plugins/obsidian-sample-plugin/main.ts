import { Plugin } from "obsidian";

export default class DailyWorksPlugin extends Plugin {
	async onload() {
		console.log("DailyWorks 插件已加载");

		this.registerMarkdownCodeBlockProcessor(
			"daily-works",
			(source, el, ctx) => {
				const dateLine = source
					.split("\n")
					.find((line) => line.trim().startsWith("- date:"));
				const dateMatch = dateLine?.match(
					/- date:\s*(\d{4}-\d{2}-\d{2})/
				);

				if (dateMatch) {
					const date = dateMatch[1];

					// 创建自定义渲染元素
					const dateDiv = el.createEl("div", {
						text: `🗓️ 日期：${date}`,
					});
					dateDiv.style.padding = "8px";
					dateDiv.style.backgroundColor = "#f4f4f4";
					dateDiv.style.borderRadius = "6px";
					dateDiv.style.fontWeight = "bold";
				} else {
					el.createEl("div", { text: "⚠️ 未找到 date 参数" });
				}
			}
		);
	}

	onunload() {
		console.log("DailyWorks 插件已卸载");
	}
}
