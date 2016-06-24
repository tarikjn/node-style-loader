# server-style-loader

source: 

- https://github.com/webpack/react-webpack-server-side-example
  for style-collector code

- https://github.com/thereactivestack/style-collector-loader
  for client-side cleanup

- style-loader
  for correct loader code compatible with CSS Modules

TODO: test possible race conditions
TODO: add comparison table: add fake-style-loader, isomorphic-style-loader

table:
handles style loading
handles style collecting
handles regular CSS code
loading implementation shadows style-loader
support CSS Modules (local styles)
does not use globals
handles style-colleting
does not require adapting your components
keep using style-loader on the client-side
hot module replacement support
favor entry point vs. browser detect
does not bundle a critical path setup or modify your client code

critical path loading:
this loaders will follow the exact bahavior or client loader
import style or child components in your render functions or use router loading

Roadmap:
- test deduping
- add support for media/sourceMap
- add support for stylesheet url
- test/add hot reload support
- optimize speed/inject stylesInDom into style-loader to avoid removal
