'use strict';

var extend = require('lodash/extend');

var InputTypeMultiple = require('./multiple');
var Selectivity = require('../selectivity');

function isValidEmail(email) {

    var atIndex = email.indexOf('@');
    var dotIndex = email.lastIndexOf('.');
    var spaceIndex = email.indexOf(' ');
    return (atIndex > 0 && dotIndex > atIndex + 1 &&
            dotIndex < email.length - 2 && spaceIndex === -1);
}

function lastWord(token, length) {

    length = (length === undefined ? token.length : length);
    for (var i = length - 1; i >= 0; i--) {
        if ((/\s/).test(token[i])) {
            return token.slice(i + 1, length);
        }
    }
    return token.slice(0, length);
}

function stripEnclosure(token, enclosure) {

    if (token.charAt(0) === enclosure[0] && token.slice(-1) === enclosure[1]) {
        return token.slice(1, -1).trim();
    } else {
        return token.trim();
    }
}

function createEmailItem(token) {

    var email = lastWord(token);
    var name = token.slice(0, -email.length).trim();
    if (isValidEmail(email)) {
        email = stripEnclosure(stripEnclosure(email, '()'), '<>');
        name = stripEnclosure(name, '""').trim() || email;
        return { id: email, text: name };
    } else {
        return (token.trim() ? { id: token, text: token } : null);
    }
}

function emailTokenizer(input, selection, createToken) {

    function hasToken(input) {
        if (input) {
            for (var i = 0, length = input.length; i < length; i++) {
                switch (input[i]) {
                case ';':
                case ',':
                case '\n':
                    return true;
                case ' ':
                case '\t':
                    if (isValidEmail(lastWord(input, i))) {
                        return true;
                    }
                    break;
                case '"':
                    do { i++; } while (i < length && input[i] !== '"');
                    break;
                default:
                    continue;
                }
            }
        }
        return false;
    }

    function takeToken(input) {
        for (var i = 0, length = input.length; i < length; i++) {
            switch (input[i]) {
            case ';':
            case ',':
            case '\n':
                return { term: input.slice(0, i), input: input.slice(i + 1) };
            case ' ':
            case '\t':
                if (isValidEmail(lastWord(input, i))) {
                    return { term: input.slice(0, i), input: input.slice(i + 1) };
                }
                break;
            case '"':
                do { i++; } while (i < length && input[i] !== '"');
                break;
            default:
                continue;
            }
        }
        return {};
    }

    while (hasToken(input)) {
        var token = takeToken(input);
        if (token.term) {
            var item = createEmailItem(token.term);
            if (item && !(item.id && Selectivity.findById(selection, item.id))) {
                createToken(item);
            }
        }
        input = token.input;
    }

    return input;
}

/**
 * InputTypeEmail Constructor.
 *
 * @param options Options object. Accepts all options from the MultipleSelectivity Constructor.
 */
function InputTypeEmail(options) {

    InputTypeMultiple.call(this, options);

    this.events.on('blur', function() {
        var input = this.searchInput;
        if (input && isValidEmail(lastWord(input.value))) {
            this.add(createEmailItem(input.value));
        }
    });
}

/**
 * Methods.
 */
var callSuper = Selectivity.inherits(InputTypeEmail, InputTypeMultiple, {

    /**
     * @inherit
     *
     * Note that for the Email input type the option showDropdown is set to false and the tokenizer
     * option is set to a tokenizer specialized for email addresses.
     */
    setOptions: function(options) {

        callSuper(this, 'setOptions', extend({
            createTokenItem: createEmailItem,
            showDropdown: false,
            tokenizer: emailTokenizer
        }, options));
    }

});

module.exports = Selectivity.InputTypes.Email = InputTypeEmail;
