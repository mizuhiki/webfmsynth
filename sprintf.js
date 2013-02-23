/** tiny sprintf
 * format:
 *    "%"[arg-index-specifier"$"][sign-specifier][width-specifier][precision-specifier]type-specifier
 *
 * sign-specifier:
 *    "#": add "0", "0x", "0X" mark
 *       : typeが"o"なら先頭に"0"を追加します。
 *       : typeが"x"なら先頭に"0x"を追加します。
 *       : typeが"X"なら先頭に"0X"を追加します。
 *
 * width-specifier:
 *     n: minimize field width(0 to 9)
 *      : 最低何桁表示するかを指定します。指定可能な値は0～9です。0で非表示になります。
 *
 * precision-specifier:
 *    "."n: floating-point limit width(0 to 9) for "f". string limit width(0 to 9) for "s"
 *        : ドットと数値を指定することで小数点以下の桁数や文字列の長さを指定できます。指定可能な値は0～9です。
 *        : typeが"f"なら、小数点以下の桁数を指定します。浮動小数点値が丸められることがあります。0で小数点以下が非表示になります。
 *        : typeが"s"なら、文字列の長さを指定します。指定した長さ以上の文字は切り捨てられます。0で非表示になります。
 *
 * type-specifier:
 *    "d": signed decimal number
 *    "u": unsigned decimal number
 *    "o": unsigned octet number
 *    "x": unsigned hex number(lower case)
 *    "X": unsigned hex number(upper case)
 *    "f": floating-point number
 *    "c": the character with that ASCII value
 *    "s": string
 *    "%": "%"
 *
 * arg-index-specifier:
 *     n : arguments index
 *       : 引数のインデックスを指定します。引数の再利用と、引数の順序を指定することによりi18n化をサポートします。
 *
 */
if (!String.prototype.sprintf) {
  String.prototype.sprintf = function(args___) {
    var rv = [], i = 0, v, width, precision, sign, idx, argv = arguments, next = 0;
    var s = (this + "     ").split(""); // add dummy 5 chars.
    var unsign = function(val) { return (val >= 0) ? val : val % 0x100000000 + 0x100000000; };
    var getArg = function() { return argv[idx ? idx - 1 : next++]; };

    for (; i < s.length - 5; ++i) {
      if (s[i] !== "%") { rv.push(s[i]); continue; }

      ++i, idx = 0, precision = undefined;

      // arg-index-specifier
      if (!isNaN(parseInt(s[i])) && s[i + 1] === "$") { idx = parseInt(s[i]); i += 2; }
      // sign-specifier
      sign = (s[i] !== "#") ? false : ++i, true;
      // width-specifier
      width = (isNaN(parseInt(s[i]))) ? 0 : parseInt(s[i++]);
      // precision-specifier
      if (s[i] === "." && !isNaN(parseInt(s[i + 1]))) { precision = parseInt(s[i + 1]); i += 2; }

      switch (s[i]) {
      case "d": v = parseInt(getArg()).toString(); break;
      case "u": v = parseInt(getArg()); if (!isNaN(v)) { v = unsign(v).toString(); } break;
      case "o": v = parseInt(getArg()); if (!isNaN(v)) { v = (sign ? "0"  : "") + unsign(v).toString(8); } break;
      case "x": v = parseInt(getArg()); if (!isNaN(v)) { v = (sign ? "0x" : "") + unsign(v).toString(16); } break;
      case "X": v = parseInt(getArg()); if (!isNaN(v)) { v = (sign ? "0X" : "") + unsign(v).toString(16).toUpperCase(); } break;
      case "f": v = parseFloat(getArg()).toFixed(precision); break;
      case "c": width = 0; v = getArg(); v = (typeof v === "number") ? String.fromCharCode(v) : NaN; break;
      case "s": width = 0; v = getArg().toString(); if (precision) { v = v.substring(0, precision); } break;
      case "%": width = 0; v = s[i]; break; 
      default:  width = 0; v = "%" + ((width) ? width.toString() : "") + s[i].toString(); break;
      }
      if (isNaN(v)) { v = v.toString(); }
      (v.length < width) ? rv.push(" ".repeat(width - v.length), v) : rv.push(v);
    }
    return rv.join("");
  };
}
if (!String.prototype.repeat) {
  String.prototype.repeat = function(n) {
    var rv = [], i = 0, sz = n || 1, s = this.toString();
    for (; i < sz; ++i) { rv.push(s); }
    return rv.join("");
  };
}
