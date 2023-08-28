import { App, Modal, Plugin, PluginSettingTab, Setting } from "obsidian";
import { saveImageFiles } from "src/modules";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	statusBarItemEl?: HTMLElement;

	async onload() {
		await this.loadSettings();

		// Initialize statusBatItem
		this.statusBarItemEl = this.addStatusBarItem();
		this.statusBarItemEl.setText("");

		// This creates an icon
		this.addRibbonIcon("leaf", "Media Sync for Obsidian", (evt: MouseEvent) => {
			saveImageFiles(this.app, this.manifest.id, this, this.statusBarItemEl!);
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
