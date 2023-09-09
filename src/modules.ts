import {
	App,
	DataAdapter,
	Notice,
	Plugin,
	requestUrl,
	TFile,
	Vault,
} from "obsidian";

const ALLOW_FILE_EXTENSIONS = ["png", "jpg", "jpeg", "gif"];
const START_MESSAGE = "Media Sync Start!!";
const PROCESS_MESSAGE = "Media Sync in Process!!";
const END_MESSAGE = "Media Sync End!!";
const ERROR_MESSAGE = "Error Occurred!! Please retry.";

export const SaveDirectory = {
	Default: "_media-sync_resources",
	AttachmentFolderPath: "attachmentFolderPath",
	UserDefined: "resourceFolderName",
};
export type SaveDirectory = (typeof SaveDirectory)[keyof typeof SaveDirectory];

export interface MediaSyncSettings {
	setting: {
		saveDirectory: SaveDirectory;
		resourceFolderName: string;
	};
}
export const DEFAULT_SETTINGS: MediaSyncSettings = {
	setting: {
		saveDirectory: SaveDirectory.Default,
		resourceFolderName: "",
	},
};

const getImageFilePrefix = (): string => {
	const now = new Date();

	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0"); // 月は0から始まるため+1
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");

	return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const getRondomString = (): string => {
	return Math.floor(Math.random() * 100000)
		.toString()
		.padStart(5, "0");
};

const getResorceFolderName = (
	vault: Vault,
	settings: MediaSyncSettings
): string => {
	let resourceFolderName: string | undefined;

	if (settings.setting.saveDirectory === SaveDirectory.AttachmentFolderPath) {
		resourceFolderName = (vault as unknown as any).getConfig(
			SaveDirectory.AttachmentFolderPath
		);
	} else if (settings.setting.saveDirectory === SaveDirectory.UserDefined) {
		resourceFolderName = settings.setting.resourceFolderName;
	}

	if (!resourceFolderName) {
		resourceFolderName = SaveDirectory.Default;
	}

	return resourceFolderName!;
};

const downloadImages = async (
	data: any,
	files: TFile[],
	resorceFolderName: string,
	adapter: DataAdapter,
	notices: Notice[]
) => {
	if (!(await adapter.exists(resorceFolderName))) {
		adapter.mkdir(resorceFolderName);
	}

	const totalCount = files.filter(
		(file) => !data?.files?.some((f: any) => f === file.name)
	)?.length;
	let currentCount = 1;
	const errorUrls: string[] = [];

	for (const file of files) {
		const isSkip = data?.files?.some((f: any) => f === file.name);
		if (isSkip) {
			continue;
		}

		notices.push(
			new Notice(`${PROCESS_MESSAGE} (${currentCount}/${totalCount})`, 0)
		);

		let fileContent = await adapter.read(file!.path);
		const prefix = getImageFilePrefix();

		const currentFileFolderPath = `${resorceFolderName}/${prefix}`;

		if (!(await adapter.exists(currentFileFolderPath))) {
			adapter.mkdir(currentFileFolderPath);
		}

		const urlMatches = fileContent.match(/https?:\/\/([\w!\?/\-_=\.&%;:,])+/g);

		if (urlMatches) {
			for (const urlMatche of urlMatches) {
				if (errorUrls.some((url) => url === urlMatche)) {
					continue;
				}

				try {
					const response = await requestUrl(urlMatche);
					const contentType = response.headers["content-type"];

					if (contentType.startsWith("image")) {
						const extension = contentType.split("/")[1];
						const isAllowExtension = ALLOW_FILE_EXTENSIONS.some(
							(ext) => extension.toLowerCase() === ext
						);

						let filePath = `${currentFileFolderPath}/${prefix}_${getRondomString()}`;
						if (isAllowExtension) {
							filePath = `${filePath}.${extension}`;
						} else {
							const realUrl = urlMatche.split("?")[0];
							const realExtention = ALLOW_FILE_EXTENSIONS.find((ext) =>
								realUrl.toLowerCase().endsWith(ext)
							);

							if (realExtention) {
								filePath = `${filePath}.${realExtention}`;
							} else {
								continue;
							}
						}

						fileContent = fileContent.replace(urlMatche, filePath);
						await adapter.writeBinary(filePath, response.arrayBuffer);
					}
				} catch (error) {
					console.log("access url error: " + urlMatche);
					console.log(error);
					errorUrls.push(urlMatche);
				}
			}
		}

		await adapter.write(file!.path, fileContent);

		data.files.push(file.name);
		currentCount++;
	}
};

export const saveImageFiles = async (
	app: App,
	plugin: Plugin,
	settings: MediaSyncSettings
) => {
	const notices: Notice[] = [];
	notices.push(new Notice(START_MESSAGE, 0));
	console.log(START_MESSAGE);

	notices.push(new Notice(PROCESS_MESSAGE, 0));
	console.log(PROCESS_MESSAGE);

	let data: any;

	try {
		const dataJson = await plugin.loadData();
		data = JSON.parse(dataJson);
	} catch (error) {
		console.log("load data error");
		console.log(error);
	}

	if (!data) {
		data = {};
	}
	if (!data.files) {
		data.files = [];
	}

	const files = app.vault.getMarkdownFiles();
	const resorceFolderName = getResorceFolderName(app.vault, settings);

	await downloadImages(
		data,
		files,
		resorceFolderName,
		app.vault.adapter,
		notices
	);

	try {
		const saveData = JSON.stringify({ ...data, ...settings });
		await plugin.saveData(saveData);
	} catch (error) {
		console.log("save data error");
		console.log(error);
		notices.push(new Notice(ERROR_MESSAGE, 0));
	}

	notices.push(new Notice(END_MESSAGE, 0));

	// sleep 2 seconds
	await new Promise((r) => setTimeout(r, 2000));

	notices.forEach((notice) => notice.hide());

	console.log(END_MESSAGE);
};
