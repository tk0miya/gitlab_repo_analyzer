// src/index.ts
console.log("GitLab Repository Analyzer \u304C\u8D77\u52D5\u3057\u307E\u3057\u305F");
function main() {
  console.log("TypeScript\u8A2D\u5B9A\u304C\u6B63\u5E38\u306B\u52D5\u4F5C\u3057\u3066\u3044\u307E\u3059");
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
export {
  main as default
};
