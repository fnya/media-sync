import { App, Notice, requestUrl, Plugin } from "obsidian";

const RESOURCE_FOLDER_NAME = "resources";
const ALLOW_FILE_EXTENSIONS = ["png", "jpg", "jpeg", "gif"];
const START_MESSAGE = "Media Sync Start!!";
const PROCESS_MESSAGE = "Media Sync in Process!!";
const END_MESSAGE = "Media Sync End!!";

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

export const saveImageFiles = async (app: App, id: string, plugin: Plugin) => {
	const startNotice = new Notice(START_MESSAGE, 0);
	console.log(START_MESSAGE);

	const processNotice = new Notice(PROCESS_MESSAGE, 0);
	console.log(PROCESS_MESSAGE);

	let data: any;

	// load data
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

	const adapter = app.vault.adapter;

	const resorceFolderName = `_${id}_${RESOURCE_FOLDER_NAME}`;

	if (!(await adapter.exists(resorceFolderName))) {
		adapter.mkdir(resorceFolderName);
	}

	for (const file of files) {
		const isSkip = data?.files?.some((f: any) => f === file.name);
		if (isSkip) {
			continue;
		}

		let fileContent = await adapter.read(file!.path);
		const prefix = getImageFilePrefix();

		const currentFileFolderPath = `${resorceFolderName}/${prefix}`;

		if (!(await adapter.exists(currentFileFolderPath))) {
			adapter.mkdir(currentFileFolderPath);
		}

		const urlMatches = fileContent.match(/https?:\/\/([\w!\?/\-_=\.&%;:,])+/g);

		if (urlMatches) {
			for (const urlMatche of urlMatches) {
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
						}

						fileContent = fileContent.replace(urlMatche, filePath);
						await adapter.writeBinary(filePath, response.arrayBuffer);
					}
				} catch (error) {
					console.log("access url error: " + urlMatche);
					console.log(error);
				}
			}
		}

		await adapter.write(file!.path, fileContent);

		data.files.push(file.name);
	}

	// save data
	const saveJson = JSON.stringify(data, null, 2);
	try {
		await plugin.saveData(saveJson);
	} catch (error) {
		console.log("save data error");
		console.log(error);
	}

	const endNotice = new Notice(END_MESSAGE, 0);

	// sleep 2 seconds
	await new Promise((r) => setTimeout(r, 2000));

	startNotice.hide();
	processNotice.hide();
	endNotice.hide();

	console.log(END_MESSAGE);
};
