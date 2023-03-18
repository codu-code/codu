# Hotkeys and Shortcuts Guide

This guide provides an overview of the available hotkeys and shortcuts for the custom text editor. These hotkeys and shortcuts can help you speed up your content creation and editing process.

## Hotkeys

| Hotkey          | Description                  |
|-----------------|------------------------------|
| `Tab`           | Trigger shortcuts (see below)|
| `Backspace`     | Select Previous word         |
| `Meta+(1-6)`    | Heading 1 - 6                |
| `Meta+b`        | Bold                         |
| `Meta+i`        | Italic                       |
| `Meta+shift+b`  | Bold & Italic                |
| `Meta+s`        | Code Snippet                 |
| `Meta+shift+c`  | Code Block                   |
| `Meta+Shift+.`  | Block Quote                  |
| `Meta+u`        | URL                          |
| `Meta+l`        | Link                         |
| `Meta+Shift+i`  | Image                        |

## How to Use Hotkeys

1. Press the meta key (windows key or mac cmd key) with the desired hotkey eg, cmd+1 to render #
2. You can also highlight the word and then use the hotkey combination and for this you can double click the word or phrase or press meta+backspace a few times to highlight the required selection of text.
3. For Links and images, select the text and then use the hotkey combination. You will be prompted for the url.


## Markdown Shortcuts

| Shortcut | Description                            | Example                       |
|----------|----------------------------------------|-------------------------------|
| `/link`  | Create a link with text and URL        | `[text](url)`                 |
| `/image` | Insert an image with alt text and URL  | `![text](url)`                |

## Custom Tag Shortcuts

| Shortcut      | Description                        | Example                       |
|---------------|------------------------------------|-------------------------------|
| `/media`      | Embed a media file with src        | `{% media src="url" /%}`      |
| `/youtube`    | Embed a YouTube video with src     | `{% youtube src="url" /%}`    |
| `/codepen`    | Embed a CodePen project with src   | `{% codepen src="url" /%}`    |
| `/codesandbox`| Embed a CodeSandbox project with src | `{% codesandbox src="url" /%}`|

## How to Use Shortcuts

1. Place the cursor where you want to insert the content.
2. Type the shortcut (e.g., `/link`).
3. Press the `Tab` key.
4. For Markdown shortcuts `/link` and `/image`, you'll be prompted to enter the text and URL.
5. For custom tag shortcuts, you'll be prompted to enter the URL for the `src` attribute. 

The editor will automatically replace the shortcut with the corresponding content.
