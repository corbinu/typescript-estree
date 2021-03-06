"use strict";
/**
 * @fileoverview Convert comment using TypeScript token scanner
 * @author James Henry <https://github.com/JamesHenry>
 * @copyright jQuery Foundation and other contributors, https://jquery.org/
 * MIT License
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = __importDefault(require("typescript"));
const node_utils_1 = __importDefault(require("./node-utils"));
/**
 * Converts a TypeScript comment to an Esprima comment.
 * @param {boolean} block True if it's a block comment, false if not.
 * @param {string} text The text of the comment.
 * @param {number} start The index at which the comment starts.
 * @param {number} end The index at which the comment ends.
 * @param {LineAndColumnData} startLoc The location at which the comment starts.
 * @param {LineAndColumnData} endLoc The location at which the comment ends.
 * @returns {Object} The comment object.
 * @private
 */
function convertTypeScriptCommentToEsprimaComment(block, text, start, end, startLoc, endLoc) {
    const comment = {
        type: block ? 'Block' : 'Line',
        value: text
    };
    if (typeof start === 'number') {
        comment.range = [start, end];
    }
    if (typeof startLoc === 'object') {
        comment.loc = {
            start: startLoc,
            end: endLoc
        };
    }
    return comment;
}
/**
 * Convert comment from TypeScript Triva Scanner.
 * @param  {ts.Scanner} triviaScanner TS Scanner
 * @param  {ts.SourceFile} ast the AST object
 * @param  {string} code TypeScript code
 * @returns {ESTreeComment}     the converted ESTreeComment
 * @private
 */
function getCommentFromTriviaScanner(triviaScanner, ast, code) {
    const kind = triviaScanner.getToken();
    const isBlock = kind === typescript_1.default.SyntaxKind.MultiLineCommentTrivia;
    const range = {
        pos: triviaScanner.getTokenPos(),
        end: triviaScanner.getTextPos(),
        kind: triviaScanner.getToken()
    };
    const comment = code.substring(range.pos, range.end);
    const text = isBlock
        ? comment.replace(/^\/\*/, '').replace(/\*\/$/, '')
        : comment.replace(/^\/\//, '');
    const loc = node_utils_1.default.getLocFor(range.pos, range.end, ast);
    const esprimaComment = convertTypeScriptCommentToEsprimaComment(isBlock, text, range.pos, range.end, loc.start, loc.end);
    return esprimaComment;
}
/**
 * Convert all comments for the given AST.
 * @param  {ts.SourceFile} ast the AST object
 * @param  {string} code the TypeScript code
 * @returns {ESTreeComment[]}     the converted ESTreeComment
 * @private
 */
function convertComments(ast, code) {
    const comments = [];
    /**
     * Create a TypeScript Scanner, with skipTrivia set to false so that
     * we can parse the comments
     */
    const triviaScanner = typescript_1.default.createScanner(ast.languageVersion, false, 0, code);
    let kind = triviaScanner.scan();
    while (kind !== typescript_1.default.SyntaxKind.EndOfFileToken) {
        const start = triviaScanner.getTokenPos();
        const end = triviaScanner.getTextPos();
        let container = null;
        switch (kind) {
            case typescript_1.default.SyntaxKind.SingleLineCommentTrivia:
            case typescript_1.default.SyntaxKind.MultiLineCommentTrivia: {
                const comment = getCommentFromTriviaScanner(triviaScanner, ast, code);
                comments.push(comment);
                break;
            }
            case typescript_1.default.SyntaxKind.CloseBraceToken:
                container = node_utils_1.default.getNodeContainer(ast, start, end);
                if (container.kind === typescript_1.default.SyntaxKind.TemplateMiddle ||
                    container.kind === typescript_1.default.SyntaxKind.TemplateTail) {
                    kind = triviaScanner.reScanTemplateToken();
                    continue;
                }
                break;
            case typescript_1.default.SyntaxKind.SlashToken:
            case typescript_1.default.SyntaxKind.SlashEqualsToken:
                container = node_utils_1.default.getNodeContainer(ast, start, end);
                if (container.kind === typescript_1.default.SyntaxKind.RegularExpressionLiteral) {
                    kind = triviaScanner.reScanSlashToken();
                    continue;
                }
                break;
            default:
                break;
        }
        kind = triviaScanner.scan();
    }
    return comments;
}
exports.convertComments = convertComments;
