import {
	App,
	Editor,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownView,
	TFile,
	TFolder,
} from "obsidian";
import {
	DEFAULT_SETTINGS,
	MediaSyncSettings,
	SaveDirectory,
	saveFiles,
} from "src/modules";

export default class MediaSyncPlugin extends Plugin {
	settings: MediaSyncSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon("leaf", "Media sync", (evt: MouseEvent) => {
			saveFiles(this.app, this, this.settings);
		});

		this.addSettingTab(new MediaSyncSettingTab(this.app, this));
		this.addCommand({
			id: 'media-sync-now',
			name: 'Media sync: Sync This File',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				
				saveFiles(this.app, this, this.settings, [view.file as TFile], false);
			}
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item.setTitle("Media sync").onClick(async () => {
						if (file instanceof TFolder) {
							new Notice("Media sync does not support folders.");
							return;
						}

						saveFiles(this.app, this, this.settings, [file as TFile], false);
					});
				});
			})
		);
	}

	onunload() {}

	async loadSettings() {
		let data: any;

		try {
			data = await this.loadData();
		} catch (error) {
			console.error("load data error");
			console.error(error);
		}

		try {
			const loadData = JSON.parse(data);

			if (loadData.setting) {
				if (!this.settings?.setting) {
					this.settings = DEFAULT_SETTINGS;
				}
				this.settings.setting = loadData.setting;
			} else {
				this.settings = DEFAULT_SETTINGS;
				console.log(this.settings);
			}
		} catch (error) {
			this.settings = DEFAULT_SETTINGS;
			console.error("parse data error");
			console.error(error);
		}
	}
}

class MediaSyncSettingTab extends PluginSettingTab {
	plugin: MediaSyncPlugin;

	constructor(app: App, plugin: MediaSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Folder to store images")
			.setDesc("Specify a folder to store media files.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption(SaveDirectory.Default, "Default")
					.addOption(
						SaveDirectory.AttachmentFolderPath,
						"Obsidian attachment folder"
					)
					.addOption(SaveDirectory.UserDefined, "Custom folder")
					.setValue(this.plugin.settings.setting.saveDirectory)
					.onChange(async (value) => {
						this.plugin.settings.setting.saveDirectory = value;
						await this.saveSettings();

						if (value === SaveDirectory.UserDefined) {
							customFolderSetting.setDisabled(false);
						} else {
							customFolderSetting.setDisabled(true);
							const input =
								customFolderSetting.settingEl.querySelector("input");
							if (input) {
								input.value = "";
								this.plugin.settings.setting.resourceFolderName = "";
								await this.saveSettings();
							}
						}
					});
			});

		const customFolderSetting = new Setting(containerEl)
			.setName("Custom folder name")
			.setDesc("Specify folder name  where the media files will be stored.")
			.addText((text) => {
				text
					.setPlaceholder("Custom folder name")
					.setValue(this.plugin.settings.setting.resourceFolderName)
					.onChange(async (value) => {
						this.plugin.settings.setting.resourceFolderName = value;
						await this.saveSettings();
					})
					.setDisabled(true);
			});
	}

	async saveSettings() {
		try {
			let data: any;
			try {
				data = await this.plugin.loadData();
			} catch (error) {
				console.error("load data error");
				console.error(error);
			}

			let saveData: any;
			if (data) {
				saveData = JSON.stringify({
					...JSON.parse(data),
					...this.plugin.settings,
				});
			} else {
				saveData = JSON.stringify({
					...this.plugin.settings,
				});
			}

			await this.plugin.saveData(saveData);
		} catch (error) {
			console.error("save data error");
			console.error(error);
		}
	}
}
