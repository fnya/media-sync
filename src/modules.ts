import { App, Notice, FileSystemAdapter, requestUrl, Plugin } from "obsidian";

const RESOURCE_FOLDER_NAME = "resources";
const ALLOW_FILE_EXTENSIONS = ["png", "jpg", "jpeg", "gif"];
const START_MESSAGE = "Media Sync Start!!";
const END_MESSAGE = "Media Sync End!!";

export const saveImageFiles = async (
	app: App,
	id: string,
	plugin: Plugin,
	statusBatItem: HTMLElement
) => {
	new Notice(START_MESSAGE);
	statusBatItem.setText(START_MESSAGE);
	console.log(START_MESSAGE);

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

	const files = app.vault.getFiles().filter((file) => file.extension === "md");

	const fileSystemAdapter = app.vault.adapter as FileSystemAdapter;

	const resorceFolderName = `_${id}_${RESOURCE_FOLDER_NAME}`;

	if (!(await fileSystemAdapter.exists(resorceFolderName))) {
		fileSystemAdapter.mkdir(resorceFolderName);
	}

	for (const file of files) {
		const isSkip = data?.files?.some((f: any) => f === file.name);
		if (isSkip) {
			continue;
		}

		let fileContent = await fileSystemAdapter.read(file!.path);

		const currentFileFolderPath = `${resorceFolderName}/${encodeURIComponent(
			Math.random().toString(36)
		)}`;

		if (!(await fileSystemAdapter.exists(currentFileFolderPath))) {
			fileSystemAdapter.mkdir(currentFileFolderPath);
		}

		// get image files
		const imageMatches = fileContent.match(
			/https?:\/\/([\w!\?/\-_=\.&%;:,])+/g
		);

		if (imageMatches) {
			for (const imageMatch of imageMatches) {
				try {
					const response = await requestUrl(imageMatch);
					const contentType = response.headers["content-type"];

					if (contentType.startsWith("image")) {
						const extension = contentType.split("/")[1];
						const isAllowExtension = ALLOW_FILE_EXTENSIONS.some(
							(ext) => extension.toLowerCase() === ext
						);

						// ? encoding is not recognized as a file.
						let filePath = `${currentFileFolderPath}/${encodeURIComponent(
							imageMatch.contains("?") ? imageMatch.split("?")[0] : imageMatch
						)}`;
						if (isAllowExtension) {
							filePath = `${filePath}.${extension}`;
						}

						fileContent = fileContent.replace(imageMatch, filePath);
						await fileSystemAdapter.writeBinary(filePath, response.arrayBuffer);
					}
				} catch (error) {
					console.log("access url error: " + imageMatch);
					console.log(error);
				}
			}
		}

		await fileSystemAdapter.write(file!.path, fileContent);

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

	console.log(END_MESSAGE);
	new Notice(END_MESSAGE);
	statusBatItem.setText(END_MESSAGE);
};
