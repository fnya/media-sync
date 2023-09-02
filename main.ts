import { Plugin } from "obsidian";
import { saveImageFiles } from "src/modules";

export default class MediaSyncPlugin extends Plugin {
	async onload() {
		// This creates an icon
		this.addRibbonIcon("leaf", "Media Sync", (evt: MouseEvent) => {
			saveImageFiles(this.app, this.manifest.id, this);
		});
	}

	onunload() {}
}
