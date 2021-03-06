"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Converts TypeScript AST into ESTree format.
 * @author Nicholas C. Zakas
 * @author James Henry <https://github.com/JamesHenry>
 * @copyright jQuery Foundation and other contributors, https://jquery.org/
 * MIT License
 */
const convert_1 = __importStar(require("./convert"));
const convert_comments_1 = require("./convert-comments");
const node_utils_1 = __importDefault(require("./node-utils"));
/**
 * Extends and formats a given error object
 * @param  {Object} error the error object
 * @returns {Object}       converted error object
 */
function convertError(error) {
    return node_utils_1.default.createError(error.file, error.start, error.message || error.messageText);
}
exports.default = (ast, extra, shouldProvideParserServices) => {
    /**
     * The TypeScript compiler produced fundamental parse errors when parsing the
     * source.
     */
    if (ast.parseDiagnostics.length) {
        throw convertError(ast.parseDiagnostics[0]);
    }
    /**
     * Recursively convert the TypeScript AST into an ESTree-compatible AST
     */
    const estree = convert_1.default({
        node: ast,
        parent: null,
        ast,
        additionalOptions: {
            errorOnUnknownASTType: extra.errorOnUnknownASTType || false,
            useJSXTextNode: extra.useJSXTextNode || false,
            shouldProvideParserServices
        }
    });
    /**
     * Optionally convert and include all tokens in the AST
     */
    if (extra.tokens) {
        estree.tokens = node_utils_1.default.convertTokens(ast);
    }
    /**
     * Optionally convert and include all comments in the AST
     */
    if (extra.comment) {
        estree.comments = convert_comments_1.convertComments(ast, extra.code);
    }
    let astMaps = undefined;
    if (shouldProvideParserServices) {
        astMaps = convert_1.getASTMaps();
        convert_1.resetASTMaps();
    }
    return { estree, astMaps };
};
