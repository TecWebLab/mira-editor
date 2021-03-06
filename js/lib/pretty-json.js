

// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
var stringOrChar = /("(?:[^"]|\\.)*")|[:,]/g;


var validKeys = [
  'name','tag','widgets','widget','datasource','children',
  'head','maps','class','value','href','parse','tag','src','alt','bind'
];

var invalidKeys = [
  'id', 'typeElement', 'componentWidth', 'html'
];

function prettify(string) {
  return string.replace(stringOrChar, function(match, string) {
    if (string) {
      return match
    }
    return match + " "
  })
}

function get(options, name, defaultValue) {
  return (name in options ? options[name] : defaultValue)
}


function stringify(obj, options) {
  options = options || {}
  var indent = JSON.stringify([1], null, get(options, "indent", 2)).slice(2, -3)
  var maxLength = (indent === "" ? Infinity : get(options, "maxLength", 80))
  
  return (function _stringify(obj, currentIndent, reserved) {
    if (obj && typeof obj.toJSON === "function") {
      obj = obj.toJSON()
    }

    var string = JSON.stringify(obj, function(key, value){
        if(parseInt(key) == "NaN") return undefined
        if(invalidKeys.indexOf(key) > -1) return undefined; //remove elementos desnecessários
        
        if((typeof value === "string"  || typeof value === "object") && value.length == 0) return undefined;

        return value;
    });

    //var string = JSON.stringify(obj)

    if (string === undefined) {
      return string
    }

    var length = maxLength - currentIndent.length - reserved

    if (string.length <= length) {
      var prettified = prettify(string)
      if (prettified.length <= length) {
        return prettified
      }
    }

    if (typeof obj === "object" && obj !== null) {
      var nextIndent = currentIndent + indent
      var items = []
      var delimiters
      /**
       * Description
       * @method comma
       * @param {} array
       * @param {} index
       * @return ConditionalExpression
       */
      var comma = function(array, index) {
        return (index === array.length - 1 ? 0 : 1)
      }

      if (Array.isArray(obj)) {
        for (var index = 0; index < obj.length; index++) {
          items.push(
            _stringify(obj[index], nextIndent, comma(obj, index)) || "null"
          )
        }
        delimiters = "[]"
      } else {
        Object.keys(obj).forEach(function(key, index, array) {
          var keyPart = JSON.stringify(key) + ": "
          var value = _stringify(obj[key], nextIndent,
                                 keyPart.length + comma(array, index))
          if (value !== undefined) {
            items.push(keyPart + value)
          }
        })
        delimiters = "{}"
      }

      if (items.length > 0) {
        return [
          delimiters[0],
          indent + items.join(",\n" + nextIndent),
          delimiters[1]
        ].join("\n" + currentIndent)
      }
    }

    return string
  }(obj, "", 0))
}