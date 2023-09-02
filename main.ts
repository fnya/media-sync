import { Plugin } from "obsidian";
import { saveImageFiles } from "src/modules";

export default class MediaSyncPlugin extends Plugin {
	statusBarItemEl?: HTMLElement;

	async onload() {
		// Initialize statusBarItem
		this.statusBarItemEl = this.addStatusBarItem();
		this.statusBarItemEl.setText("");

		// This creates an icon
		this.addRibbonIcon("leaf", "Media Sync", (evt: MouseEvent) => {
			saveImageFiles(this.app, this.manifest.id, this, this.statusBarItemEl!);
		});
	}

	onunload() {}
}
