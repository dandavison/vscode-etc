install: clean build uninstall
	code --install-extension vscode-etc-*.vsix --force
	code --list-extensions --show-versions | grep vscode-etc

clean:
	@rm *.vsix 2>/dev/null || true

build:
	vsce package

uninstall:
	code --uninstall-extension dandavison.vscode-etc || true
	! code --list-extensions --show-versions | grep vscode-etc
