install: build
	code --install-extension etc-0.0.1.vsix --force

build:
	vsce package
