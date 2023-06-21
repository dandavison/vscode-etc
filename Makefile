install: build
	code --install-extension process-0.0.1.vsix

build:
	vsce package
