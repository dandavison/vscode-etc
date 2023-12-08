install: build
	code --install-extension dandavison-etc-0.0.1.vsix --force

build:
	vsce package
