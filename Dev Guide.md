> 详见官方文档： https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin

---

# 1、下载示例插件

前往插件目录：
```shell
# 在根路径下执行
mkdir .obsidian/plugins
cd .obsidian/plugins
```

克隆示例插件：
```shell
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git
```

# 2、构建插件

```shell
# 导航到插件目录
cd obsidian-sample-plugin

# 安装依赖项
npm install

# 编译源代码。
# 在终端中运行以下命令，当修改源代码时，该命令会持续运行并重新编译插件。
npm run dev
```

# 3、启用插件

- 通过 Obsidian - View - Force Reload 进行强制重新加载
	- 或者，在命令面板中，选择“不保存重新加载应用”以重新加载插件
- 在 Settings 中，启用插件 即可

# 4、更新插件清单 `manifest.json`

```json
{
	"id": "sample-plugin", // 将 `id` 更改为唯一的标识符，例如 `"hello-world"`
	"name": "Sample Plugin", // 将 `name` 更改为易于理解的名称，例如 `"Hello world"`
	"version": "1.0.0",
	"minAppVersion": "0.15.0",
	"description": "Demonstrates some of the capabilities of the Obsidian API.",
	"author": "Andy Meng",
	"authorUrl": "andy_m129@163.com",
	"fundingUrl": "https://github.com/AndyM129",
	"isDesktopOnly": false
}
```

最后，将插件文件夹重命名为与插件的 `id` 一致

再重启 Obsidian 以加载插件清单中的新更改

Tip：每次修改 `manifest.json` 后，请记得重启 Obsidian

# 5、更新源代码

- 在你的代码编辑器中打开 `main.ts` 
- 将插件类名从 `MyPlugin` 更改为 `HelloWorldPlugin`

## 5.1、安装 Hot-Reload 插件以在开发过程中自动重新加载插件，以便优化开发体验

> 插件地址： https://github.com/pjeby/hot-reload#

参考如下命令进行安装：
```shell
cd .obsidian/plugins
git clone https://github.com/pjeby/hot-reload.git
```

然后启用插件，就可以在 `npm run dev` 执行状态下，修改插件源码后，Obsidian 会自动更新

# 6、打包发布

先更新 package.json 文件，示例如下：
```json
{
	"name": "obsidian-andym129-daily-works-plugin", // 修改这个
	"version": "1.0.0", // 修改这个
	"description": "从指定目录下的笔记中 查找指定日期的内容 并进行显示", // 修改这个
	"main": "main.js",
	"scripts": {
		"dev": "node esbuild.config.mjs",
		"build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
		"copy": "PLUGIN_NAME=$(basename \"$PWD\") && mkdir -p \"$PLUGIN_NAME\" && cp manifest.json main.js styles.css \"$PLUGIN_NAME\"/", // 加上这个！！！
		"version": "node version-bump.mjs && git add manifest.json versions.json"
	},
	"keywords": [],
	"author": "",
	"license": "MIT",
	"devDependencies": {
		"@types/node": "^16.11.6",
		"@typescript-eslint/eslint-plugin": "5.29.0",
		"@typescript-eslint/parser": "5.29.0",
		"builtin-modules": "3.3.0",
		"esbuild": "0.17.3",
		"obsidian": "latest",
		"tslib": "2.4.0",
		"typescript": "4.7.4"
	}
}
```

然后修改 manifest.json ，示例如下：
```json
{
	"id": "obsidian-andym129-daily-works-plugin",
	"name": "Andy's Obsidian Daily Works",
	"version": "1.0.0",
	"minAppVersion": "0.15.0",
	"description": "从指定目录下的笔记中 查找指定日期的内容 并进行显示",
	"author": "Andy Meng",
	"authorUrl": "andy_m129@163.com",
	"fundingUrl": "https://github.com/AndyM129",
	"isDesktopOnly": false
}
```

再修改插件目录名为  manifest.json 中 id 的值

接着打包：
```shell
npm run build && npm run copy
```

构建产物 会在 当前目录下 与当前目录同名的目录下：
```shell
obsidian-andym129-daily-works-plugin
├─ main.js
├─ manifest.json
└─ styles.css
```

将该目录 复制到 插件目录、再启用插件，即可。



