import fs from "node:fs";
import path from "node:path";

// Exercise both existing electron-builder templates through every boolean branch.
export function renderInstallerCases(ejs, builderRoot) {
  const rendered = [];
  for (const name of ["msi", "msiWrapped"]) {
    const source = fs
      .readFileSync(path.join(builderRoot, "templates", name, "template.xml"), "utf8")
      .replace(/{{/g, "<%")
      .replace(/}}/g, "%>")
      .replace(/\$\{([^}]+)}/g, "<%=$1%>");
    const render = ejs.compile(source);
    for (let flags = 0; flags < 64; flags++) {
      const enabled = (bit) => Boolean(flags & (1 << bit));
      rendered.push(
        render({
          productId: "00000000-0000-4000-8000-000000000001",
          productName: "AAMVA & Test",
          upgradeCode: "00000000-0000-4000-8000-000000000002",
          version: "1.0.0.0",
          manufacturer: "Test <Company>",
          compressionLevel: "high",
          iconId: "icon",
          iconPath: enabled(0) ? "C:\\Test App\\icon.ico" : null,
          isRunAfterFinish: enabled(1),
          isAssisted: enabled(2),
          isPerMachine: enabled(3),
          isCreateDesktopShortcut: enabled(4),
          isCreateStartMenuShortcut: enabled(5),
          installationDirectoryWixName: "Test App",
          programFilesId: "ProgramFiles64Folder",
          menuCategory: enabled(0) ? "Test Category" : null,
          dirs: '<Directory Id="Subdir" Name="Data"/>',
          files: '<Component Id="Test"/>',
          exeSourcePath: "C:\\Test App\\setup.exe",
          impersonate: enabled(3) ? "no" : "yes",
          wrappedInstallerArgs: enabled(2) ? "/S /allusers" : "/S"
        })
      );
    }
  }
  return rendered;
}
