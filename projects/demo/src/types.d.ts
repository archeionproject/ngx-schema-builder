// Raw text imports, enabled by the `.md` text loader in angular.json.
declare module '*.md' {
  const content: string;
  export default content;
}
