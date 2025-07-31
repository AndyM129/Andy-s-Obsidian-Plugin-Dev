import {
	App,
	Plugin,
	PluginManifest,
	TFile,
	MarkdownRenderer,
	MarkdownPostProcessorContext,
} from "obsidian";

export default class DailyWorksPlugin extends Plugin {
	private vaultName: string;

	async onload() {
		this.vaultName = this.app.vault.getName(); // 添加一行
		this.registerMarkdownCodeBlockProcessor(
			"daily-works",
			this.processDailyWorks.bind(this)
		);
	}

	async processDailyWorks(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		const config = this.parseYamlLikeBlock(source);
		const targetDate = config.date;
		const dir = config.dir;

		if (!targetDate || !dir) {
			el.createEl("p", { text: "⚠️ 参数错误，请提供 `date` 和 `dir`。" });
			return;
		}

		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.path.startsWith(dir + "/"));

		const allSections: {
			time: Date;
			filePath: string;
			text: string;
		}[] = [];

		for (const file of files) {
			const content = await this.app.vault.read(file);
			const sections = this.extractSectionsByDate(content, targetDate);

			for (const section of sections) {
				allSections.push({
					time: section.time,
					filePath: file.path,
					text: section.text,
				});
			}
		}

		// 全部统一按时间升序排序
		allSections.sort((a, b) => a.time.getTime() - b.time.getTime());

		// 构造最终渲染文本
		let output = "";

		for (const section of allSections) {
			output += `> 📄 **${section.filePath}**\n\n`;

			// 将第一行（# xxx）转成带链接的标题
			const lines = section.text.split("\n");
			const headingLine = lines[0];
			const restLines = lines.slice(1).join("\n");

			// 提取标题内容（去掉前缀的 "# "）
			const headingText = headingLine.replace(/^#\s*/, "").trim();

			// 构建跳转链接
			const encodedFilePath = encodeURIComponent(section.filePath);
			const encodedHeading = encodeURIComponent(headingText);
			const link = `obsidian://open?vault=${encodeURIComponent(this.vaultName)}&file=${encodedFilePath}&heading=${encodedHeading}`;

			output += `[${headingLine}](${link})\n\n${restLines}\n\n---\n\n`;
		}

		// 使用 Obsidian 内部 markdown 渲染器渲染
		await MarkdownRenderer.renderMarkdown(output, el, ctx.sourcePath, this);
	}

	parseYamlLikeBlock(source: string): { [key: string]: string } {
		const lines = source.split("\n").map((line) => line.trim());
		const config: Record<string, string> = {};

		for (const line of lines) {
			const match = line.match(/^- (\w+):\s*(.+)$/);
			if (match) {
				config[match[1]] = match[2];
			}
		}

		return config;
	}

	extractSectionsByDate(
		content: string,
		date: string
	): { time: Date; text: string }[] {
		const lines = content.split("\n");

		const sections: {
			time: Date;
			text: string;
		}[] = [];

		let currentSection: string[] = [];
		let currentTime: Date | null = null;
		let inMatchingSection = false;

		const datePattern = new RegExp(
			`^#\\s+.*(${date}\\s+\\d{2}:\\d{2}:\\d{2})`
		);

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.startsWith("# ")) {
				// 保存之前一节
				if (
					inMatchingSection &&
					currentSection.length > 0 &&
					currentTime
				) {
					sections.push({
						time: currentTime,
						text: currentSection.join("\n"),
					});
				}

				const match = line.match(datePattern);
				if (match) {
					currentTime = new Date(match[1]); // 提取完整时间
					currentSection = [line];
					inMatchingSection = true;
				} else {
					currentSection = [];
					currentTime = null;
					inMatchingSection = false;
				}
			} else {
				if (inMatchingSection) {
					currentSection.push(line);
				}
			}
		}

		// 收尾处理
		if (inMatchingSection && currentSection.length > 0 && currentTime) {
			sections.push({
				time: currentTime,
				text: currentSection.join("\n"),
			});
		}

		return sections;
	}
}
