import {
	App,
	Plugin,
	PluginManifest,
	TFile,
	MarkdownRenderer,
	MarkdownPostProcessorContext,
} from "obsidian";

export default class DailyWorksPlugin extends Plugin {
	async onload() {
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

		let output = "";

		for (const file of files) {
			const content = await this.app.vault.read(file);
			const sections = this.extractSectionsByDate(content, targetDate);

			if (sections.length > 0) {
				output += `### 📄 ${file.path}\n`;
				for (const section of sections) {
					output += section + "\n\n";
				}
			}
		}

		// 用 Obsidian 的渲染器渲染 markdown 到 el
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

	extractSectionsByDate(content: string, date: string): string[] {
		const lines = content.split("\n");
		const result: string[] = [];

		let currentSection: string[] = [];
		let inMatchingSection = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.startsWith("# ")) {
				// 遇到新的一级标题
				if (inMatchingSection && currentSection.length > 0) {
					result.push(currentSection.join("\n"));
				}

				// 判断新标题是否包含目标日期
				if (line.includes(date)) {
					currentSection = [line];
					inMatchingSection = true;
				} else {
					currentSection = [];
					inMatchingSection = false;
				}
			} else {
				if (inMatchingSection) {
					currentSection.push(line);
				}
			}
		}

		// 收尾处理
		if (inMatchingSection && currentSection.length > 0) {
			result.push(currentSection.join("\n"));
		}

		return result;
	}
}
