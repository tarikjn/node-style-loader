var chai = require('chai');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

global.sinon = require('sinon');
global.expect = chai.expect;

//rewire doesn't play well with our setup.js.  I'll investigate eventually, for now, it's required in the test files themselves
