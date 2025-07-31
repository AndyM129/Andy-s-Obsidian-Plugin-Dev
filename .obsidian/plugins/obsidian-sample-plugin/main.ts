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
		this.vaultName = this.app.vault.getName();
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
			const lines = section.text.split("\n");
			const headingLine = lines[0];
			const restLines = lines.slice(1).join("\n");

			// 1️⃣ 原始标题内容（含 Emoji）
			const originalHeadingText = headingLine.replace(/^#\s*/, "").trim();

			// 2️⃣ 提取时间（如 20:12:31）
			const timeMatch = originalHeadingText.match(
				/\d{4}-\d{2}-\d{2}\s+(\d{2}:\d{2}:\d{2})/
			);
			const timeStr = timeMatch ? timeMatch[1] : "??:??:??";

			// 3️⃣ 提取原标题最后部分（如 "工作1"）
			const workTitleMatch = originalHeadingText.match(/🗒️\s*(.+)$/);
			const workTitle = workTitleMatch
				? workTitleMatch[1].trim()
				: "Untitled";

			// 4️⃣ 提取文件名（去除路径与后缀）
			const fileName =
				section.filePath.split("/").pop()?.replace(/\.md$/, "") ??
				"Unknown";

			// 5️⃣ 生成显示标题
			const displayTitle = `🕒 ${timeStr}  🗒️ ${fileName}#${workTitle}`;

			// 6️⃣ 构造链接 markdown
			const internalLink = `[[${fileName}#${originalHeadingText}|${displayTitle}]]`;

			// 7️⃣ 拼接一级标题和正文
			output += `# ${internalLink}\n\n${restLines}\n\n---\n\n`;
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
