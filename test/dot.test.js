'use strict';

var test = require('./util').test;
var assert = require("assert")
var doT = require("..");

var _globals = (function(){ return this || (0,eval)("this"); }());
var fn = function(){};

function encodeHTMLFunctionGenerator(doNotSkipEncoded) {
	var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" },
		matchHTML = doNotSkipEncoded ? /[&<>"'\/]/g : /&(?!#?\w+;)|<|>|"|'|\//g;
	return function(code) {
		return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : "";
	};
}

describe('doT', function(){
	var basictemplate = "<div>{{!it.foo}}</div>";
	var basiccompiled = doT.template(basictemplate);

	describe('.name', function (){
		it('should have a name', function(){
			assert.strictEqual(doT.name, 'doT');
		});
	});

	describe('#template()', function(){
		it('should return a function', function(){
			assert.equal(typeof basiccompiled, "function");
		});
	});

	describe('#()', function(){
		it('should render the template', function(){
			assert.equal(basiccompiled({foo:"http"}), "<div>http</div>");
			assert.equal(basiccompiled({foo:"http://abc.com"}), "<div>http:&#47;&#47;abc.com</div>");
			assert.equal(basiccompiled({}), "<div></div>");
		});
	});

	describe('encoding with doNotSkipEncoded=false', function() {
		it('should not replace &', function() {
			global._encodeHTML = undefined;
			doT.templateSettings.doNotSkipEncoded = false;
			var fn = doT.template('<div>{{!it.foo}}</div>');
			assert.equal(fn({foo:"&amp;"}), "<div>&amp;</div>");
		});
	});

	describe('interpolate 2 numbers', function() {
		it('should print numbers next to each other', function() {
			test([
				'{{=it.one}}{{=it.two}}',
				'{{= it.one}}{{= it.two}}',
				'{{= it.one }}{{= it.two }}'
			], {one:1, two: 2}, '12');
		});
	});

	describe('evaluate JavaScript', function() {
		it('should print numbers next to each other', function() {
			test([
				'{{ it.one = 1; it.two = 2; }}{{= it.one }}{{= it.two }}',
			], {}, '12');
		});
	});

	describe('encoding with doNotSkipEncoded=true', function() {
		it('should replace &', function() {
			global._encodeHTML = undefined;
			doT.templateSettings.doNotSkipEncoded = true;
			assert.equal(doT.template('<div>{{!it.foo}}</div>')({foo:"&amp;"}), "<div>&#38;amp;</div>");
			assert.equal(doT.template('{{!it.a}}')({a:"& < > / ' \""}), "&#38; &#60; &#62; &#47; &#39; &#34;");
			assert.equal(doT.template('{{!"& < > / \' \\""}}')(), "&#38; &#60; &#62; &#47; &#39; &#34;");
		});
	});

	describe('invalid JS in templates', function() {
		it('should throw exception', function() {
			assert.throws(function() {
				var fn = doT.template('<div>{{= foo + }}</div>');
			});
		});
	});

	describe('using global encodeHTML function', function() {
		it('should generate function without encodeHTML()-function', function() {
			var settings = Object.assign({}, doT.templateSettings, {
				globalEncodeHTMLFnName: '_myEncodeHTML',
				selfcontained: false,
				doNotSkipEncoded: true
			});

			fn = doT.template('<div>{{!it.foo}}</div>',settings);
			assert.equal(fn.toString(),"function anonymous(it\n" +
				") {\n" +
				"var out='<div>'+_myEncodeHTML(it.foo)+'</div>';return out;\n" +
				"}");
		});

		it('should render correct html with doNotSkipEncoded = false', function() {
			delete _globals._encodeHTML;
			_globals._myEncodeHTML = encodeHTMLFunctionGenerator(false);
			assert.equal(fn({foo:"&amp;"}),"<div>&amp;</div>");
		});

		it('should render correct html with doNotSkipEncoded = true', function() {
			delete _globals._encodeHTML;
			_globals._myEncodeHTML = encodeHTMLFunctionGenerator(true);
			assert.equal(fn({foo:"&amp;"}),"<div>&#38;amp;</div>");
		});
	});
});
