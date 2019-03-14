"use strict";

const {parseManURL, parseRoffArgs, resolveManRef} = require("..");

describe("Utility functions", () => {
	describe("parseManURL()", () => {
		const defaults = {
			name: "",
			section: "",
			fragment: "",
			searchPath: "",
			username: "",
			password: "",
		};
		
		describe("Protocols", () => {
			it("recognises obvious-looking protocols", () => {
				expect(parseManURL("man://ls"))        .to.include({name: "ls"});
				expect(parseManURL("man-page://ls"))   .to.include({name: "ls"});
				expect(parseManURL("man-doc://ls"))    .to.include({name: "ls"});
				expect(parseManURL("x-man://ls"))      .to.include({name: "ls"});
				expect(parseManURL("x-man-page://ls")) .to.include({name: "ls"});
				expect(parseManURL("x-man-doc://ls"))  .to.include({name: "ls"});
			});
			
			it("doesn't parse unrecognised protocols", () => {
				expect(parseManURL("woman://ls")) .to.be.null;
				expect(parseManURL("-man://ls"))  .to.be.null;
				expect(parseManURL("man-://ls"))  .to.be.null;
				expect(parseManURL("http://ls"))  .to.be.null;
				expect(parseManURL("mailto:man")) .to.be.null;
			});
			
			it("doesn't parse strings without protocols", () => {
				expect(parseManURL("ls(1)"))  .to.be.null;
				expect(parseManURL("ls.1"))   .to.be.null;
				expect(parseManURL("ls/1"))   .to.be.null;
				expect(parseManURL("1/ls"))   .to.be.null;
				expect(parseManURL("/man.1")) .to.be.null;
			});
			
			it("matches protocols case-insensitively", () => {
				expect(parseManURL("MAN://ls"))        .to.include({name: "ls"});
				expect(parseManURL("Man-Page://ls"))   .to.include({name: "ls"});
				expect(parseManURL("mAN-dOc://ls"))    .to.include({name: "ls"});
				expect(parseManURL("X-Man://ls"))      .to.include({name: "ls"});
				expect(parseManURL("x-MaN-pAgE://ls")) .to.include({name: "ls"});
				expect(parseManURL("X-mAN-dOC://ls"))  .to.include({name: "ls"});
			});
			
			it("allows leading slashes to be omitted", () => {
				expect(parseManURL("man:ls"))        .to.include({name: "ls"});
				expect(parseManURL("man-page:ls"))   .to.include({name: "ls"});
				expect(parseManURL("man-doc:ls"))    .to.include({name: "ls"});
				expect(parseManURL("x-man:ls"))      .to.include({name: "ls"});
				expect(parseManURL("x-man-page:ls")) .to.include({name: "ls"});
				expect(parseManURL("x-man-doc:ls"))  .to.include({name: "ls"});
			});
			
			it("allows hyphens to be omitted after `man`", () => {
				expect(parseManURL("manpage://ls"))   .to.include({name: "ls"});
				expect(parseManURL("mandoc://ls"))    .to.include({name: "ls"});
				expect(parseManURL("x-manpage://ls")) .to.include({name: "ls"});
				expect(parseManURL("x-mandoc://ls"))  .to.include({name: "ls"});
			});
			
			it("requires a hyphen when prefixed by `x-`", () => {
				expect(parseManURL("xman://ls"))      .to.be.null;
				expect(parseManURL("xman-page://ls")) .to.be.null;
				expect(parseManURL("xman-doc://ls"))  .to.be.null;
			});
		});
		
		describe("Names", () => {
			it("parses names without sections", () => {
				expect(parseManURL("man://ls"))  .to.eql({...defaults, name: "ls"});
				expect(parseManURL("man:grep"))  .to.eql({...defaults, name: "grep"});
				expect(parseManURL("x-man:sed")) .to.eql({...defaults, name: "sed"});
			});
			
			it("parses names beginning with digits", () => {
				expect(parseManURL("man://7z"))  .to.eql({...defaults, name: "7z"});
				expect(parseManURL("man:1"))     .to.eql({...defaults, name: "1"});
				expect(parseManURL("x-man:24"))  .to.eql({...defaults, name: "24"});
			});
			
			it("parses names containing punctuation", () => {
				expect(parseManURL("man://l-s"))   .to.eql({...defaults, name: "l-s"});
				expect(parseManURL("man://ls.a"))  .to.eql({...defaults, name: "ls.a"});
				expect(parseManURL("man://foo."))  .to.eql({...defaults, name: "foo."});
				expect(parseManURL("man:gr:ep"))   .to.eql({...defaults, name: "gr:ep"});
				expect(parseManURL("x-man:l?!s?")) .to.eql({...defaults, name: "l?!s?"});
			});
			
			it("ignores trailing slashes", () => {
				expect(parseManURL("man://ls/"))   .to.eql({...defaults, name: "ls"});
				expect(parseManURL("man:ls//"))    .to.eql({...defaults, name: "ls"});
				expect(parseManURL("man://ls///")) .to.eql({...defaults, name: "ls"});
			});
			
			it("decodes URI-encoded characters", () => {
				expect(parseManURL("man://l%73"))  .to.eql({...defaults, name: "ls"});
				expect(parseManURL("man:%6Cs"))    .to.eql({...defaults, name: "ls"});
				expect(parseManURL("man:%6c%73"))  .to.eql({...defaults, name: "ls"});
				expect(parseManURL("man://l%2Fs")) .to.eql({...defaults, name: "l/s"});
				expect(parseManURL("man://ls%2f")) .to.eql({...defaults, name: "ls/"});
			});
		});
		
		describe("Sections", () => {
			describe("Bracketed notation", () => {
				it("parses numeric sections", () => {
					let result = {...defaults, name: "ls", section: "1"};
					expect(parseManURL("man://ls(1)"))      .to.eql(result);
					expect(parseManURL("man:ls(1)"))        .to.eql(result);
					expect(parseManURL("man-page://ls(1)")) .to.eql(result);
					expect(parseManURL("man-page:ls(1)"))   .to.eql(result);
					
					result = {...defaults, name: "printf", section: "3"};
					expect(parseManURL("man://printf(3)"))      .to.eql(result);
					expect(parseManURL("man:printf(3)"))        .to.eql(result);
					expect(parseManURL("man-page://printf(3)")) .to.eql(result);
					expect(parseManURL("man-page:printf(3)"))   .to.eql(result);
				});
				
				it("parses sections with group suffixes", () => {
					let result = {...defaults, name: "ls", section: "1m"};
					expect(parseManURL("man://ls(1m)"))      .to.eql(result);
					expect(parseManURL("man:ls(1m)"))        .to.eql(result);
					expect(parseManURL("man-page://ls(1m)")) .to.eql(result);
					expect(parseManURL("man-page:ls(1m)"))   .to.eql(result);
					
					result = {...defaults, name: "foo", section: "7z"};
					expect(parseManURL("man://foo(7z)"))      .to.eql(result);
					expect(parseManURL("man:foo(7z)"))        .to.eql(result);
					expect(parseManURL("man-page://foo(7z)")) .to.eql(result);
					expect(parseManURL("man-page:foo(7z)"))   .to.eql(result);
				});
				
				it("parses non-numeric sections", () => {
					const result = {...defaults, name: "ls", section: "a"};
					expect(parseManURL("man://ls(a)"))        .to.eql(result);
					expect(parseManURL("man:ls(a)"))          .to.eql(result);
					expect(parseManURL("man-page://ls(a)"))   .to.eql(result);
					expect(parseManURL("man-page:ls(a)"))     .to.eql(result);
					
					result.section = "foo";
					expect(parseManURL("man://ls(foo)"))      .to.eql(result);
					expect(parseManURL("man:ls(foo)"))        .to.eql(result);
					expect(parseManURL("man-page://ls(foo)")) .to.eql(result);
					expect(parseManURL("man-page:ls(foo)"))   .to.eql(result);
				});
				
				it("parses sections which contain slashes", () => {
					const ls = {...defaults, name: "ls"};
					expect(parseManURL("man://ls(1/sparc)")) .to.eql({...ls, section: "1/sparc"});
					expect(parseManURL("man:ls(vms/vax)"))   .to.eql({...ls, section: "vms/vax"});
					expect(parseManURL("man://ls(a//b)"))    .to.eql({...ls, section: "a//b"});
					expect(parseManURL("man://ls(/1)"))      .to.eql({...ls, section: "/1"});
				});
				
				it("parses sections which contain dots", () => {
					const ls = {...defaults, name: "ls"};
					expect(parseManURL("man://ls(1.sparc)")) .to.eql({...ls, section: "1.sparc"});
					expect(parseManURL("man:ls(vms.vax)"))   .to.eql({...ls, section: "vms.vax"});
					expect(parseManURL("man://ls(a..b)"))    .to.eql({...ls, section: "a..b"});
					expect(parseManURL("man://ls(.1)"))      .to.eql({...ls, section: ".1"});
				});
				
				it("ignores sections containing whitespace", () => {
					expect(parseManURL("man://ls( 1)"))  .to.eql({...defaults, name: "ls( 1)"});
					expect(parseManURL("man://ls(1 )"))  .to.eql({...defaults, name: "ls(1 )"});
					expect(parseManURL("man://ls( 1 )")) .to.eql({...defaults, name: "ls( 1 )"});
					expect(parseManURL("man://ls( )"))   .to.eql({...defaults, name: "ls( )"});
					expect(parseManURL("man://ls(7 z)")) .to.eql({...defaults, name: "ls(7 z)"});
				});
				
				it("ignores sections with nested brackets", () => {
					expect(parseManURL("man://ls((1)a)")) .to.eql({...defaults, name: "ls((1)a)"});
					expect(parseManURL("man://ls(()"))    .to.eql({...defaults, name: "ls(()"});
					expect(parseManURL("man://ls(1(a))")) .to.eql({...defaults, name: "ls(1(a))"});
					expect(parseManURL("man://ls((1))"))  .to.eql({...defaults, name: "ls((1))"});
				});
				
				it("decodes URI-encoded characters", () => {
					expect(parseManURL("man://ls(%31)"))     .to.eql({...defaults, name: "ls",  section: "1"});
					expect(parseManURL("man://ls(1%73)"))    .to.eql({...defaults, name: "ls",  section: "1s"});
					expect(parseManURL("man:ls(3%6C)"))      .to.eql({...defaults, name: "ls",  section: "3l"});
					expect(parseManURL("man:ls(2%2e)"))      .to.eql({...defaults, name: "ls",  section: "2."});
					expect(parseManURL("man:ls(%37%6c%73)")) .to.eql({...defaults, name: "ls",  section: "7ls"});
					expect(parseManURL("man://l%2Fs(1%31)")) .to.eql({...defaults, name: "l/s", section: "11"});
					expect(parseManURL("man://%2f(1)"))      .to.eql({...defaults, name: "/",   section: "1"});
				});
				
				it("tolerates empty sections", () => {
					const result = {...defaults, name: "ls", section: ""};
					expect(parseManURL("man://ls()"))      .to.eql(result);
					expect(parseManURL("man:ls()"))        .to.eql(result);
					expect(parseManURL("man-page://ls()")) .to.eql(result);
					expect(parseManURL("man-page:ls()"))   .to.eql(result);
				});
				
				it("ignores trailing slashes", () => {
					const result = {...defaults, name: "ls", section: "1m"};
					expect(parseManURL("man://ls(1m)/"))      .to.eql(result);
					expect(parseManURL("man:ls(1m)/"))        .to.eql(result);
					expect(parseManURL("man-page://ls(1m)/")) .to.eql(result);
					expect(parseManURL("man-page:ls(1m)/"))   .to.eql(result);
				});
			});
			
			describe("Dot-separated sections", () => {
				it("parses numeric sections", () => {
					let result = {...defaults, name: "ls", section: "1"};
					expect(parseManURL("man://ls.1"))      .to.eql(result);
					expect(parseManURL("man:ls.1"))        .to.eql(result);
					expect(parseManURL("man-page://ls.1")) .to.eql(result);
					expect(parseManURL("man-page:ls.1"))   .to.eql(result);
					
					result = {...defaults, name: "printf", section: "3"};
					expect(parseManURL("man://printf.3"))      .to.eql(result);
					expect(parseManURL("man:printf.3"))        .to.eql(result);
					expect(parseManURL("man-page://printf.3")) .to.eql(result);
					expect(parseManURL("man-page:printf.3"))   .to.eql(result);
				});
				
				it("parses sections with group suffixes", () => {
					let result = {...defaults, name: "ls", section: "1m"};
					expect(parseManURL("man://ls.1m"))       .to.eql(result);
					expect(parseManURL("man:ls.1m"))         .to.eql(result);
					expect(parseManURL("man-page://ls.1m"))  .to.eql(result);
					expect(parseManURL("man-page:ls.1m"))    .to.eql(result);
					
					result = {...defaults, name: "foo", section: "7z"};
					expect(parseManURL("man://foo.7z"))      .to.eql(result);
					expect(parseManURL("man:foo.7z"))        .to.eql(result);
					expect(parseManURL("man-page://foo.7z")) .to.eql(result);
					expect(parseManURL("man-page:foo.7z"))   .to.eql(result);
				});
				
				it("doesn't match names beginning with a dot", () => {
					expect(parseManURL("man://.1"))    .to.eql({...defaults, name: ".1"});
					expect(parseManURL("man://..1.1")) .to.eql({...defaults, name: "..1", section: "1"});
					expect(parseManURL("man://.1.2"))  .to.eql({...defaults, name: ".1",  section: "2"});
					expect(parseManURL("man://.1z."))  .to.eql({...defaults, name: ".1z."});
				});
				
				it("doesn't match names ending with a dot", () => {
					expect(parseManURL("man://1."))    .to.eql({...defaults, name: "1."});
					expect(parseManURL("man://1.1..")) .to.eql({...defaults, name: "1.1.."});
					expect(parseManURL("man://1.2."))  .to.eql({...defaults, name: "1.2."});
					expect(parseManURL("man://1z."))   .to.eql({...defaults, name: "1z."});
				});
				
				it("only matches the last dot-separated segment", () => {
					let result = {...defaults, name: "ls.pl", section: "1"};
					expect(parseManURL("man://ls.pl.1"))   .to.eql(result);
					expect(parseManURL("man:ls.pl.1"))     .to.eql(result);
					expect(parseManURL("x-man:ls.pl.1/"))  .to.eql(result);
					
					result.name = "ls2.1";
					expect(parseManURL("man://ls2.1.1"))    .to.eql(result);
					expect(parseManURL("man:ls2.1.1"))      .to.eql(result);
					expect(parseManURL("x-man:ls2.1.1/"))   .to.eql(result);
					
					result.name = "ls.pl.";
					expect(parseManURL("man://ls.pl..1"))   .to.eql(result);
					expect(parseManURL("man:ls.pl..1"))     .to.eql(result);
					expect(parseManURL("x-man:ls.pl..1/"))  .to.eql(result);
					
					result = {...defaults, name: "ls.2.5", section: "8n"};
					expect(parseManURL("man://ls.2.5.8n"))  .to.eql(result);
					expect(parseManURL("man:ls.2.5.8n"))    .to.eql(result);
					expect(parseManURL("x-man:ls.2.5.8n/")) .to.eql(result);
				});
				
				it("only matches conventional-looking sections", () => {
					expect(parseManURL("man://ls.pl")) .to.eql({...defaults, name: "ls.pl"});
					expect(parseManURL("man://ls.p1")) .to.eql({...defaults, name: "ls.p1"});
					expect(parseManURL("man://7z.z"))  .to.eql({...defaults, name: "7z.z"});
					expect(parseManURL("man://3.gp"))  .to.eql({...defaults, name: "3.gp"});
				});
				
				it("recognises the Tcl-specific `n` section", () => {
					const result = {...defaults, name: "ls", section: "n"};
					expect(parseManURL("man://ls.n"))      .to.eql(result);
					expect(parseManURL("man:ls.n"))        .to.eql(result);
					expect(parseManURL("man-page://ls.n")) .to.eql(result);
					expect(parseManURL("man-page:ls.n"))   .to.eql(result);
				});
				
				it("recognises the SQL-specific `l` section", () => {
					const result = {...defaults, name: "ls", section: "l"};
					expect(parseManURL("man://ls.l"))      .to.eql(result);
					expect(parseManURL("man:ls.l"))        .to.eql(result);
					expect(parseManURL("man-page://ls.l")) .to.eql(result);
					expect(parseManURL("man-page:ls.l"))   .to.eql(result);
				});
				
				it("decodes URI-encoded characters", () => {
					expect(parseManURL("man://ls.%31"))     .to.eql({...defaults, name: "ls",  section: "1"});
					expect(parseManURL("man://ls.1%73"))    .to.eql({...defaults, name: "ls",  section: "1s"});
					expect(parseManURL("man:ls.3%6C"))      .to.eql({...defaults, name: "ls",  section: "3l"});
					expect(parseManURL("man:ls.2%2e"))      .to.eql({...defaults, name: "ls",  section: "2."});
					expect(parseManURL("man:ls.%37%6c%73")) .to.eql({...defaults, name: "ls",  section: "7ls"});
					expect(parseManURL("man://l%2Fs.1%31")) .to.eql({...defaults, name: "l/s", section: "11"});
					expect(parseManURL("man://%2f.1"))      .to.eql({...defaults, name: "/",   section: "1"});
				});
				
				it("ignores trailing slashes", () => {
					const result = {...defaults, name: "ls", section: "1m"};
					expect(parseManURL("man://ls.1m/"))      .to.eql(result);
					expect(parseManURL("man:ls.1m/"))        .to.eql(result);
					expect(parseManURL("man-page://ls.1m/")) .to.eql(result);
					expect(parseManURL("man-page:ls.1m/"))   .to.eql(result);
				});
			});
		
			describe("Slash-delimited paths", () => {
				it("parses names which follow sections", () => {
					const result = {...defaults, name: "ls", section: "1"};
					expect(parseManURL("man://1/ls"))  .to.eql(result);
					expect(parseManURL("man:1/ls"))    .to.eql(result);
					expect(parseManURL("man://1/ls/")) .to.eql(result);
					
					result.section = "3n";
					expect(parseManURL("man://3n/ls"))  .to.eql(result);
					expect(parseManURL("man:3n/ls"))    .to.eql(result);
					expect(parseManURL("man://3n/ls/")) .to.eql(result);
				});
				
				it("parses sections which follow names", () => {
					const result = {...defaults, name: "ls", section: "1"};
					expect(parseManURL("man://ls/1"))  .to.eql(result);
					expect(parseManURL("man:ls/1"))    .to.eql(result);
					expect(parseManURL("man://ls/1/")) .to.eql(result);
					
					result.section = "3n";
					expect(parseManURL("man://ls/3n"))  .to.eql(result);
					expect(parseManURL("man:ls/3n"))    .to.eql(result);
					expect(parseManURL("man://ls/3n/")) .to.eql(result);
				});
				
				it("parses segments which contain dots", () => {
					expect(parseManURL("man://3/ls.1")) .to.eql({...defaults, name: "ls.1",  section: "3"});
					expect(parseManURL("man:3/ls.1z"))  .to.eql({...defaults, name: "ls.1z", section: "3"});
					expect(parseManURL("man:3.1/ls.1")) .to.eql({...defaults, name: "ls.1",  section: "3.1"});
					expect(parseManURL("man:ls.1/3"))   .to.eql({...defaults, name: "ls.1",  section: "3"});
					expect(parseManURL("man:ls.1/3.1")) .to.eql({...defaults, name: "ls.1",  section: "3.1"});
				});
				
				it("parses names beginning with digits", () => {
					expect(parseManURL("man://1/3")) .to.eql({...defaults, name: "1",  section: "3"});
					expect(parseManURL("man:7z/1/")) .to.eql({...defaults, name: "7z", section: "1"});
					expect(parseManURL("man:1n/3"))  .to.eql({...defaults, name: "1n", section: "3"});
					expect(parseManURL("man:12/3"))  .to.eql({...defaults, name: "12", section: "3"});
					expect(parseManURL("man:1/3n"))  .to.eql({...defaults, name: "1",  section: "3n"});
					expect(parseManURL("man:1n/3s")) .to.eql({...defaults, name: "1n", section: "3s"});
				});
				
				it("decodes URI-encoded characters", () => {
					expect(parseManURL("man://ls/%31"))      .to.eql({...defaults, name: "ls",  section: "1"});
					expect(parseManURL("man://ls/%31%2F"))   .to.eql({...defaults, name: "ls",  section: "1/"});
					expect(parseManURL("man://%6Cs/%31"))    .to.eql({...defaults, name: "ls",  section: "1"});
					expect(parseManURL("man://%6C%2fs/%33")) .to.eql({...defaults, name: "l/s", section: "3"});
				});
				
				it("collapses duplicate slashes", () => {
					const result = {...defaults, name: "ls", section: "1"};
					expect(parseManURL("man://ls//1"))     .to.eql(result);
					expect(parseManURL("man://ls///1///")) .to.eql(result);
					expect(parseManURL("man://1///ls//"))  .to.eql(result);
					expect(parseManURL("x-man:1//ls//"))   .to.eql(result);
				});
				
				it("recognises sections repeated in brackets", () => {
					expect(parseManURL("x-man-doc://1/ls(1)"))  .to.eql({...defaults, name: "ls",   section: "1"});
					expect(parseManURL("x-man-doc:3n/ls(3n)/")) .to.eql({...defaults, name: "ls",   section: "3n"});
					expect(parseManURL("man://3n/ls(3n)/"))     .to.eql({...defaults, name: "ls",   section: "3n"});
					expect(parseManURL("man:l/ls(l)"))          .to.eql({...defaults, name: "ls",   section: "l"});
					expect(parseManURL("man:l/ls.1(l)"))        .to.eql({...defaults, name: "ls.1", section: "l"});
				});
				
				it("disambiguates paths with excess segments", () => {
					const result = {...defaults, name: "grep", section: "1", searchPath: "extra/path/segments"};
					expect(parseManURL("man://grep/1/extra/path/segments"))   .to.eql(result);
					expect(parseManURL("man:grep/1/extra/path/segments/"))    .to.eql(result);
					expect(parseManURL("x-man:grep/1/extra/path//segments/")) .to.eql(result);
					expect(parseManURL("man://extra/path/segments/1/grep"))   .to.eql(result);
					expect(parseManURL("man:extra/path/segments/1/grep/"))    .to.eql(result);
					expect(parseManURL("x-man:grep/1/extra/path//segments/")) .to.eql(result);
					
					result.section = "1n";
					result.searchPath = "extra";
					expect(parseManURL("man:extra/1n/grep/")).to.eql(result);
					expect(parseManURL("man://extra/1n/grep")).to.eql(result);
					expect(parseManURL("x-man:extra/1n/grep/")).to.eql(result);
					
					result.searchPath += "/path";
					expect(parseManURL("man:grep/1n/extra/path")).to.eql(result);
					expect(parseManURL("man://grep/1n/extra/path")).to.eql(result);
					expect(parseManURL("x-man:grep/1n/extra/path")).to.eql(result);
				});
			});
		});
		
		describe("Fragment identifiers", () => {
			it("parses fragments after names", () => {
				expect(parseManURL("man://ls#foo")) .to.eql({...defaults, name: "ls", fragment: "foo"});
				expect(parseManURL("man:ls#//foo")) .to.eql({...defaults, name: "ls", fragment: "//foo"});
				expect(parseManURL("man:ls#1"))     .to.eql({...defaults, name: "ls", fragment: "1"});
				expect(parseManURL("man:ls#.1"))    .to.eql({...defaults, name: "ls", fragment: ".1"});
				expect(parseManURL("man:ls#(1)"))   .to.eql({...defaults, name: "ls", fragment: "(1)"});
				expect(parseManURL("man:ls#(1)/"))  .to.eql({...defaults, name: "ls", fragment: "(1)/"});
			});
			
			it("doesn't parse fragment-only URLs", () => {
				expect(parseManURL("man://#foo")) .to.be.null;
				expect(parseManURL("man:#//foo")) .to.be.null;
				expect(parseManURL("man:#1"))     .to.be.null;
				expect(parseManURL("man:#.1"))    .to.be.null;
				expect(parseManURL("man:#(1)"))   .to.be.null;
				expect(parseManURL("man:#(1)/"))  .to.be.null;
			});
			
			it("parses fragments after bracketed sections", () => {
				const result = {...defaults, name: "ls", section: "1"};
				expect(parseManURL("man://ls(1)#foo"))    .to.eql({...result, fragment: "foo"});
				expect(parseManURL("man://ls(1)#foo(1)")) .to.eql({...result, fragment: "foo(1)"});
				expect(parseManURL("man://ls(1)#foo.1"))  .to.eql({...result, fragment: "foo.1"});
				expect(parseManURL("man://ls(1)#foo.1n")) .to.eql({...result, fragment: "foo.1n"});
				expect(parseManURL("man://ls(1)#foo/1"))  .to.eql({...result, fragment: "foo/1"});
				expect(parseManURL("man://ls(1)#"))       .to.eql({...result, fragment: ""});
			});
			
			it("parses fragments after dot-separated sections", () => {
				const result = {...defaults, name: "ls", section: "1"};
				expect(parseManURL("man://ls.1#foo"))    .to.eql({...result, fragment: "foo"});
				expect(parseManURL("man://ls.1#foo(1)")) .to.eql({...result, fragment: "foo(1)"});
				expect(parseManURL("man://ls.1#foo.1"))  .to.eql({...result, fragment: "foo.1"});
				expect(parseManURL("man://ls.1#foo.1n")) .to.eql({...result, fragment: "foo.1n"});
				expect(parseManURL("man://ls.1#ls.1n#")) .to.eql({...result, fragment: "ls.1n#"});
				expect(parseManURL("man://ls.1#foo/1"))  .to.eql({...result, fragment: "foo/1"});
				expect(parseManURL("man://ls.1#"))       .to.eql({...result, fragment: ""});
				expect(parseManURL("man://ls.1#//"))     .to.eql({...result, fragment: "//"});
			});
			
			it("parses fragments after slash-delimited paths", () => {
				const result = {...defaults, name: "ls", section: "1"};
				expect(parseManURL("man://ls/1#foo"))    .to.eql({...result, fragment: "foo"});
				expect(parseManURL("man://ls/1#foo(1)")) .to.eql({...result, fragment: "foo(1)"});
				expect(parseManURL("man://ls/1#foo.1"))  .to.eql({...result, fragment: "foo.1"});
				expect(parseManURL("man://ls/1#foo.1n")) .to.eql({...result, fragment: "foo.1n"});
				expect(parseManURL("man://ls/1#ls.1n#")) .to.eql({...result, fragment: "ls.1n#"});
				expect(parseManURL("man://ls/1#foo/1"))  .to.eql({...result, fragment: "foo/1"});
				expect(parseManURL("man://ls/1#"))       .to.eql({...result, fragment: ""});
				expect(parseManURL("man://ls/1#//"))     .to.eql({...result, fragment: "//"});
				
				expect(parseManURL("man://1/ls#foo"))    .to.eql({...result, fragment: "foo"});
				expect(parseManURL("man://1/ls#foo(1)")) .to.eql({...result, fragment: "foo(1)"});
				expect(parseManURL("man://1/ls#foo.1"))  .to.eql({...result, fragment: "foo.1"});
				expect(parseManURL("man://1/ls#foo.1n")) .to.eql({...result, fragment: "foo.1n"});
				expect(parseManURL("man://1/ls#ls.1n#")) .to.eql({...result, fragment: "ls.1n#"});
				expect(parseManURL("man://1/ls#foo/1"))  .to.eql({...result, fragment: "foo/1"});
				expect(parseManURL("man://1/ls#"))       .to.eql({...result, fragment: ""});
				expect(parseManURL("man://1/ls#//"))     .to.eql({...result, fragment: "//"});
				
				result.fragment = "foo/1#";
				result.searchPath = "bar";
				expect(parseManURL("man://bar/1/ls#foo/1#")).to.eql(result);
				expect(parseManURL("man:bar/1//ls#foo/1#")).to.eql(result);
				expect(parseManURL("x-man://foo/1/foo/bar#frag")).to.eql({
					...defaults,
					name: "foo",
					section: "1",
					searchPath: "foo/bar",
					fragment: "frag",
				});
			});
		});
	
		describe("Credentials", () => {
			describe("Usernames", () => {
				it("parses names composed of letters", () => {
					expect(parseManURL("man://foo@ls"))   .to.eql({...defaults, name: "ls", username: "foo"});
					expect(parseManURL("man://ls@1"))     .to.eql({...defaults, name: "1",  username: "ls"});
					expect(parseManURL("man:foo@ls.1"))   .to.eql({...defaults, name: "ls", section: "1", username: "foo"});
					expect(parseManURL("x-man://ls@1.1")) .to.eql({...defaults, name: "1",  section: "1", username: "ls"});
				});
				
				it("parses names composed of digits", () => {
					expect(parseManURL("man://1@ls"))     .to.eql({...defaults, name: "ls", username: "1"});
					expect(parseManURL("man://1@22"))     .to.eql({...defaults, name: "22", username: "1"});
					expect(parseManURL("man://45@ls"))    .to.eql({...defaults, name: "ls", username: "45"});
					expect(parseManURL("x-man:1@ls.1"))   .to.eql({...defaults, name: "ls", section: "1",  username: "1"});
					expect(parseManURL("x-man:2@ls.1"))   .to.eql({...defaults, name: "ls", section: "1",  username: "2"});
					expect(parseManURL("x-man:3@ls.1z"))  .to.eql({...defaults, name: "ls", section: "1z", username: "3"});
					expect(parseManURL("x-man://1@1.1"))  .to.eql({...defaults, name: "1",  section: "1",  username: "1"});
					expect(parseManURL("x-man:1@ls(1)"))  .to.eql({...defaults, name: "ls", section: "1",  username: "1"});
					expect(parseManURL("x-man:2@ls(1)"))  .to.eql({...defaults, name: "ls", section: "1",  username: "2"});
					expect(parseManURL("x-man:3@ls(1z)")) .to.eql({...defaults, name: "ls", section: "1z", username: "3"});
					expect(parseManURL("x-man://1@1(1)")) .to.eql({...defaults, name: "1",  section: "1",  username: "1"});
				});
				
				it("parses alphanumeric names", () => {
					expect(parseManURL("man://foo1@ls"))  .to.eql({...defaults, name: "ls", username: "foo1"});
					expect(parseManURL("man://1ls@1"))    .to.eql({...defaults, name: "1",  username: "1ls"});
					expect(parseManURL("man:f4o@ls.1"))   .to.eql({...defaults, name: "ls", section: "1",  username: "f4o"});
					expect(parseManURL("man://2to3@1.1")) .to.eql({...defaults, name: "1",  section: "1",  username: "2to3"});
					expect(parseManURL("x-man:1n@ls.1"))  .to.eql({...defaults, name: "ls", section: "1",  username: "1n"});
					expect(parseManURL("x-man:1n@ls.1z")) .to.eql({...defaults, name: "ls", section: "1z", username: "1n"});
				});
				
				it("parses names containing dots", () => {
					expect(parseManURL("man://fo.o@ls"))   .to.eql({...defaults, name: "ls",  username: "fo.o"});
					expect(parseManURL("man://fo.o@ls.1")) .to.eql({...defaults, name: "ls",  section: "1", username: "fo.o"});
					expect(parseManURL("man://foo.@ls.2")) .to.eql({...defaults, name: "ls",  section: "2", username: "foo."});
					expect(parseManURL("man://foo.@1.2"))  .to.eql({...defaults, name: "1",   section: "2", username: "foo."});
					expect(parseManURL("man://f.1@ls.1"))  .to.eql({...defaults, name: "ls",  section: "1", username: "f.1"});
					expect(parseManURL("man://1.1@ls(2)")) .to.eql({...defaults, name: "ls",  section: "2", username: "1.1"});
					expect(parseManURL("man://fo.@1.z"))   .to.eql({...defaults, name: "1.z", username: "fo."});
					expect(parseManURL("x-man://.ar@1"))   .to.eql({...defaults, name: "1",   username: ".ar"});
					expect(parseManURL("x-man://.a.@f.1")) .to.eql({...defaults, name: "f",   section: "1", username: ".a."});
					expect(parseManURL("x-man://...@f.1")) .to.eql({...defaults, name: "f",   section: "1", username: "..."});
					expect(parseManURL("x-man://.@1.1"))   .to.eql({...defaults, name: "1",   section: "1", username: "."});
					expect(parseManURL("x-man://.@1"))     .to.eql({...defaults, name: "1",   username: "."});
				});
				
				it("parses names containing slashes", () => {
					expect(parseManURL("man://f/r@ls"))    .to.eql({...defaults, name: "ls", username: "f/r"});
					expect(parseManURL("man://f/r@ls/1"))  .to.eql({...defaults, name: "ls", username: "f/r",  section: "1"});
					expect(parseManURL("man://f/1@ls/1"))  .to.eql({...defaults, name: "ls", username: "f/1",  section: "1"});
					expect(parseManURL("man:///ls@ls/1"))  .to.eql({...defaults, name: "ls", username: "/ls",  section: "1"});
					expect(parseManURL("man:///ls@ls(1)")) .to.eql({...defaults, name: "ls", username: "/ls",  section: "1"});
					expect(parseManURL("man:/ls@ls(1/n)")) .to.eql({...defaults, name: "ls", username: "/ls",  section: "1/n"});
					expect(parseManURL("man:/l/1@ls.1"))   .to.eql({...defaults, name: "ls", username: "/l/1", section: "1"});
				});
				
				it("parses names containing symbols", () => {
					expect(parseManURL("man://f*r@ls"))  .to.eql({...defaults, name: "ls", username: "f*r"});
					expect(parseManURL("man://f-r@ls"))  .to.eql({...defaults, name: "ls", username: "f-r"});
					expect(parseManURL("man://*!&@ls"))  .to.eql({...defaults, name: "ls", username: "*!&"});
					expect(parseManURL("man://?@ls.1"))  .to.eql({...defaults, name: "ls", username: "?",   section: "1"});
					expect(parseManURL("man://$@ls(3)")) .to.eql({...defaults, name: "ls", username: "$",   section: "3"});
					expect(parseManURL("man:~n1@ls.7x")) .to.eql({...defaults, name: "ls", username: "~n1", section: "7x"});
				});
				
				it("ignores empty names", () => {
					expect(parseManURL("man://@foo"))    .to.eql({...defaults, name: "@foo"});
					expect(parseManURL("man://@foo.1"))  .to.eql({...defaults, name: "@foo", section: "1"});
					expect(parseManURL("man://@foo(1)")) .to.eql({...defaults, name: "@foo", section: "1"});
					expect(parseManURL("man://@1(foo)")) .to.eql({...defaults, name: "@1",   section: "foo"});
					expect(parseManURL("man://@1.2"))    .to.eql({...defaults, name: "@1",   section: "2"});
					expect(parseManURL("man://@1.foo"))  .to.eql({...defaults, name: "@1.foo"});
				});
				
				it("decodes URI-encoded characters", () => {
					expect(parseManURL("man://f%6Fo@ls"))  .to.eql({...defaults, name: "ls", username: "foo"});
					expect(parseManURL("man://%42%41@ls")) .to.eql({...defaults, name: "ls", username: "BA"});
					expect(parseManURL("man://f%40o@ls"))  .to.eql({...defaults, name: "ls", username: "f@o"});
					expect(parseManURL("man:b%40r@ls.1"))  .to.eql({...defaults, name: "ls", username: "b@r", section: "1"});
					expect(parseManURL("man:%40@ls(1z)"))  .to.eql({...defaults, name: "ls", username: "@",   section: "1z"});
				});
				
				it("doesn't parse names which end in an `@`", () => {
					expect(parseManURL("man://foo@"))   .to.eql({...defaults, name: "foo@"});
					expect(parseManURL("man:foo@/"))    .to.eql({...defaults, name: "foo@"});
					expect(parseManURL("man:foo@#bar")) .to.eql({...defaults, name: "foo@", fragment: "bar"});
					expect(parseManURL("man:foo@#b.1")) .to.eql({...defaults, name: "foo@", fragment: "b.1"});
					expect(parseManURL("man:foo@#@"))   .to.eql({...defaults, name: "foo@", fragment: "@"});
				});
			});
			
			describe("Passwords", () => {
				it("parses passwords composed of letters", () => {
					let result = {...defaults, name: "ls", username: "foo"};
					expect(parseManURL("man://foo:bar@ls"))   .to.eql({...result, password: "bar"});
					expect(parseManURL("man://foo:bar@ls.1")) .to.eql({...result, password: "bar", section: "1"});
					expect(parseManURL("man:foo:bar@ls(1)"))  .to.eql({...result, password: "bar", section: "1"});
					
					result = {...result, username: "1", password: "n"};
					expect(parseManURL("x-man://1:n@3.foo"))  .to.eql({...result, name: "3.foo"});
					expect(parseManURL("x-man://1:n@3(foo)")) .to.eql({...result, name: "3", section: "foo"});
				});
				
				it("parses passwords composed of digits", () => {
					let result = {...defaults, name: "ls", username: "foo", password: "1"};
					expect(parseManURL("man://foo:1@ls"))     .to.eql({...result});
					expect(parseManURL("man:foo:1@ls.1"))     .to.eql({...result, section: "1"});
					expect(parseManURL("man:foo:1@ls(1)"))    .to.eql({...result, section: "1"});
					
					result = {...result, username: "1", password: "2"};
					expect(parseManURL("x-man-page:1:2@3"))   .to.eql({...result, name: "3"});
					expect(parseManURL("x-man-page:1:2@3.4")) .to.eql({...result, name: "3", section: "4"});
					expect(parseManURL("x-man://1:2@3(4)"))   .to.eql({...result, name: "3", section: "4"});
					expect(parseManURL("x-man://1:2@3.n"))    .to.eql({...result, name: "3", section: "n"});
					expect(parseManURL("x-man://1:2@3(n)"))   .to.eql({...result, name: "3", section: "n"});
				});
				
				it("parses alphanumeric passwords", () => {
					const result = {...defaults, name: "ls", username: "foo"};
					expect(parseManURL("man://foo:b1r@ls"))   .to.eql({...result, password: "b1r"});
					expect(parseManURL("x-man:foo:7z@ls"))    .to.eql({...result, password: "7z"});
					expect(parseManURL("x-man:foo:7z@ls.1"))  .to.eql({...result, password: "7z", section: "1"});
					expect(parseManURL("man://foo:a2@ls(1)")) .to.eql({...result, password: "a2", section: "1"});
					
					result.username = "1";
					expect(parseManURL("man://1:l1@ls"))     .to.eql({...result, password: "l1"});
					expect(parseManURL("x-man:1:1l@ls/"))    .to.eql({...result, password: "1l"});
					expect(parseManURL("x-man:1:1l2@ls.1"))  .to.eql({...result, password: "1l2", section: "1"});
					expect(parseManURL("man://1:a2@ls(1a)")) .to.eql({...result, password: "a2",  section: "1a"});
				});
				
				it("parses passwords containing dots", () => {
					const result = {...defaults, name: "ls", username: "foo"};
					expect(parseManURL("man://foo:ba.r@ls"))   .to.eql({...result, password: "ba.r"});
					expect(parseManURL("man://foo:ba.r@ls.1")) .to.eql({...result, password: "ba.r", section: "1"});
					expect(parseManURL("man://foo:bar.@ls.2")) .to.eql({...result, password: "bar.", section: "2"});
					expect(parseManURL("man://foo:ba2.@1.3a")) .to.eql({...result, password: "ba2.", section: "3a", name: "1"});
					expect(parseManURL("man://foo:f.1@ls.1"))  .to.eql({...result, password: "f.1",  section: "1"});
					expect(parseManURL("man://foo:1.1@ls(2)")) .to.eql({...result, password: "1.1",  section: "2"});
					expect(parseManURL("man://f.1:fo.@1.z"))   .to.eql({...result, username: "f.1",  password: "fo.", name: "1.z"});
					
					result.username = ".";
					expect(parseManURL("x-man://.:.ar@1"))     .to.eql({...result, password: ".ar", name: "1"});
					expect(parseManURL("x-man://.:.a.@f.1"))   .to.eql({...result, password: ".a.", name: "f", section: "1"});
					expect(parseManURL("x-man://.:...@f.1"))   .to.eql({...result, password: "...", name: "f", section: "1"});
					expect(parseManURL("x-man://.:.@1.1"))     .to.eql({...result, password: ".",   name: "1", section: "1"});
					expect(parseManURL("x-man://.:.@1"))       .to.eql({...result, password: ".",   name: "1"});
				});
				
				it("parses passwords containing colons", () => {
					const result = {...defaults, username: "foo"};
					expect(parseManURL("man://foo:b:r@ls"))    .to.eql({...result, password: "b:r", name: "ls"});
					expect(parseManURL("man://foo:b:@ls/"))    .to.eql({...result, password: "b:",  name: "ls"});
					expect(parseManURL("x-man:foo::b@ls.1"))   .to.eql({...result, password: ":b",  name: "ls",  section: "1"});
					expect(parseManURL("x-man:foo::@ls(1)"))   .to.eql({...result, password: ":",   name: "ls",  section: "1"});
					expect(parseManURL("x-man:foo::@ls(1:2)")) .to.eql({...result, password: ":",   name: "ls",  section: "1:2"});
					expect(parseManURL("man://foo:b@:r.1"))    .to.eql({...result, password: "b",   name: ":r",  section: "1"});
					expect(parseManURL("man://foo:b@:r(1:2)")) .to.eql({...result, password: "b",   name: ":r",  section: "1:2"});
					expect(parseManURL("man://foo:b:@a:r(1)")) .to.eql({...result, password: "b:",  name: "a:r", section: "1"});
				});
				
				it("doesn't parse passwords containing `@`", () => {
					const result = {...defaults, username: "foo"};
					expect(parseManURL("man://foo:b@a@r"))    .to.eql({...result, password: "b", name: "a@r"});
					expect(parseManURL("man://foo:b@a@r.1"))  .to.eql({...result, password: "b", name: "a@r", section: "1"});
					expect(parseManURL("x-man:foo:b@a@:(1)")) .to.eql({...result, password: "b", name: "a@:", section: "1"});
					expect(parseManURL("x-man:foo:b@@@(@1)")) .to.eql({...result, password: "b", name: "@@",  section: "@1"});
				});
				
				it("tolerates empty passwords", () => {
					const result = {...defaults, username: "foo", password: "", name: "ls"};
					expect(parseManURL("man://foo:@ls"))      .to.eql(result);
					expect(parseManURL("x-man:foo:@ls"))      .to.eql(result);
					expect(parseManURL("man-page:foo:@:/"))   .to.eql({...result, name: ":"});
					expect(parseManURL("man-page:foo:@:(1)")) .to.eql({...result, name: ":", section: "1"});
					expect(parseManURL("x-man://foo:@:(1:)")) .to.eql({...result, name: ":", section: "1:"});
				});
				
				it("ignores passwords without usernames", () => {
					expect(parseManURL("man://:foo@ls"))       .to.eql({...defaults, name: ":foo@ls"});
					expect(parseManURL("x-man::foo@ls"))       .to.eql({...defaults, name: ":foo@ls"});
					expect(parseManURL("man-page::f:o@:/"))    .to.eql({...defaults, name: ":f:o@:"});
					expect(parseManURL("man-page::foo:@:(1)")) .to.eql({...defaults, name: ":foo:@:", section: "1"});
					expect(parseManURL("x-man://:fo::@:(1:)")) .to.eql({...defaults, name: ":fo::@:", section: "1:"});
				});
				
				it("decodes URI-encoded characters", () => {
					const result = {...defaults, username: "foo", name: "ls"};
					expect(parseManURL("man://foo:b%41r@ls"))  .to.eql({...result, password: "bAr"});
					expect(parseManURL("man://foo:%42%41@ls")) .to.eql({...result, password: "BA"});
					expect(parseManURL("man://foo:b%40r@ls"))  .to.eql({...result, password: "b@r"});
					expect(parseManURL("man:foo:b%40r@ls.1"))  .to.eql({...result, password: "b@r", section: "1"});
					expect(parseManURL("man:foo:%40@ls(1z)"))  .to.eql({...result, password: "@",   section: "1z"});
				});
			});
		});
	});

	describe("parseRoffArgs()", () => {
		it("parses unquoted arguments", () => {
			expect(parseRoffArgs("B"))       .to.eql(["B"]);
			expect(parseRoffArgs("BBB"))     .to.eql(["BBB"]);
			expect(parseRoffArgs("B I"))     .to.eql(["B", "I"]);
			expect(parseRoffArgs("B I B"))   .to.eql(["B", "I", "B"]);
			expect(parseRoffArgs("BBB III")) .to.eql(["BBB", "III"]);
		});
		
		it("parses quoted arguments", () => {
			expect(parseRoffArgs('"B"'))               .to.eql(["B"]);
			expect(parseRoffArgs('"B'))                .to.eql(["B"]);
			expect(parseRoffArgs('"B" "I'))            .to.eql(["B", "I"]);
			expect(parseRoffArgs('"B" "I"'))           .to.eql(["B", "I"]);
			expect(parseRoffArgs('"B" "I" "B'))        .to.eql(["B", "I", "B"]);
			expect(parseRoffArgs('"B" "I" "B"'))       .to.eql(["B", "I", "B"]);
			expect(parseRoffArgs('B "I I"B'))          .to.eql(["B", "I I", "B"]);
			expect(parseRoffArgs('"BBB BBB'))          .to.eql(["BBB BBB"]);
			expect(parseRoffArgs('"BBB BBB"'))         .to.eql(["BBB BBB"]);
			expect(parseRoffArgs('"BBB BBB BBB" III')) .to.eql(["BBB BBB BBB", "III"]);
		});
		
		it("parses empty arguments", () => {
			expect(parseRoffArgs(""))   .to.eql([]);
			expect(parseRoffArgs("  ")) .to.eql([]);
			expect(parseRoffArgs(null)) .to.eql(["null"]);
		});
		
		it("parses escaped quote characters", () => {
			// NOTE: Confused by these tests? That's Roff syntax for ya…
			expect(parseRoffArgs('BBB""'))               .to.eql(['BBB""']);
			expect(parseRoffArgs('"BBB""'))              .to.eql(['BBB"']);
			expect(parseRoffArgs('"BBB"" BBB'))          .to.eql(['BBB" BBB']);
			expect(parseRoffArgs('BBB"" III'))           .to.eql(['BBB""', "III"]);
			expect(parseRoffArgs('BBB""BBB III"'))       .to.eql(['BBB""BBB', 'III"']);
			expect(parseRoffArgs('BBB"""BBB III"'))      .to.eql(['BBB"""BBB', 'III"']);
			expect(parseRoffArgs('BBB"""BBB III'))       .to.eql(['BBB"""BBB', "III"]);
			expect(parseRoffArgs('"BBB""BBB BBB" III'))  .to.eql(['BBB"BBB BBB', "III"]);
			expect(parseRoffArgs('"BBB"""III BBB" III')) .to.eql(['BBB"', "III", 'BBB"', "III"]);
		});
		
		it("strips leading/trailing whitespace", () => {
			expect(parseRoffArgs("  BBB"))   .to.eql(["BBB"]);
			expect(parseRoffArgs("BBB  "))   .to.eql(["BBB"]);
			expect(parseRoffArgs("  BBB  ")) .to.eql(["BBB"]);
			expect(parseRoffArgs(" A  B"))   .to.eql(["A", "B"]);
		});
		
		it("strips comments", () => {
			expect(parseRoffArgs('BBB \\" CCC" CCC')).to.eql(["BBB"]);
			expect(parseRoffArgs('"BBB"" BBB \\" CCC" CCC')).to.eql(['BBB" BBB ']);
			expect(parseRoffArgs('\\" CCC CCC')).to.eql([]);
			expect(parseRoffArgs('  \\" \\"CCC')).to.eql([]);
		});
		
		it("retains escaped spaces", () => {
			expect(parseRoffArgs("BBB\\ BBB")) .to.eql(["BBB BBB"]);
			expect(parseRoffArgs("\\ BBB"))    .to.eql([" BBB"]);
			expect(parseRoffArgs("\\  BBB"))   .to.eql([" ", "BBB"]);
			expect(parseRoffArgs("BBB\\ "))    .to.eql(["BBB "]);
			expect(parseRoffArgs("BBB \\ "))   .to.eql(["BBB", " "]);
		});
		
		it("retains embedded tabs", () => {
			expect(parseRoffArgs("BBB\tBBB"))  .to.eql(["BBB\tBBB"]);
			expect(parseRoffArgs("BBB\t BBB")) .to.eql(["BBB\t", "BBB"]);
		});
	});

	describe("resolveManRef()", () => {
		it("resolves bracket notation", () => {
			expect(resolveManRef("foo(1)"))   .to.eql(["foo", "1"]);
			expect(resolveManRef("foo(7x)"))  .to.eql(["foo", "7x"]);
			expect(resolveManRef("foo(bar)")) .to.eql(["foo", "bar"]);
			expect(resolveManRef("7z(1)"))    .to.eql(["7z", "1"]);
			expect(resolveManRef("7z(1n)"))   .to.eql(["7z", "1n"]);
			expect(resolveManRef("7z(bar)"))  .to.eql(["7z", "bar"]);
		});
		
		it("resolves the order of individual arguments", () => {
			expect(resolveManRef("foo", "1"))   .to.eql(["foo", "1"]);
			expect(resolveManRef("foo", "1n"))  .to.eql(["foo", "1n"]);
			expect(resolveManRef("foo", 7))     .to.eql(["foo", "7"]);
			expect(resolveManRef("1",   "foo")) .to.eql(["foo", "1"]);
			expect(resolveManRef("3p",  "bar")) .to.eql(["bar", "3p"]);
			expect(resolveManRef(1,     "fo1")) .to.eql(["fo1", "1"]);
			expect(resolveManRef(0,     "f00")) .to.eql(["f00", "0"]);
		});
		
		it("only considers sections beginning with digits", () => {
			expect(resolveManRef("if",   "ntcl")) .to.eql(["if",   "ntcl"]);
			expect(resolveManRef("ntcl", "if"))   .to.eql(["ntcl", "if"]);
			expect(resolveManRef("foo",  "n"))    .to.eql(["foo",  "n"]);
			expect(resolveManRef("bar",  "n1"))   .to.eql(["bar",  "n1"]);
			expect(resolveManRef("n",    "foo"))  .to.eql(["n",    "foo"]);
			expect(resolveManRef("n1",   "bar"))  .to.eql(["n1",   "bar"]);
		});
		
		it("only considers sections shorter than 5 characters", () => {
			expect(resolveManRef("1foo",  "bar")) .to.eql(["bar",    "1foo"]);
			expect(resolveManRef("1fooo", "bar")) .to.eql(["1fooo",  "bar"]);
			expect(resolveManRef("123456", "f0")) .to.eql(["123456", "f0"]);
			expect(resolveManRef(0xDEAD, "beef")) .to.eql(["57005",  "beef"]);
		});
		
		it("replaces missing arguments with empty strings", () => {
			expect(resolveManRef())          .to.eql(["",    ""]);
			expect(resolveManRef(""))        .to.eql(["",    ""]);
			expect(resolveManRef("foo"))     .to.eql(["foo", ""]);
			expect(resolveManRef("1"))       .to.eql(["1",   ""]);
			expect(resolveManRef("7z"))      .to.eql(["7z",  ""]);
			expect(resolveManRef("a1"))      .to.eql(["a1",  ""]);
			expect(resolveManRef("ab1"))     .to.eql(["ab1", ""]);
			expect(resolveManRef("foo", "")) .to.eql(["foo", ""]);
			expect(resolveManRef("", "foo")) .to.eql(["",    "foo"]);
			expect(resolveManRef("", "1"))   .to.eql(["",    "1"]);
			expect(resolveManRef("", "1x"))  .to.eql(["",    "1x"]);
		});
		
		it("ignores extraneous arguments", () => {
			expect(resolveManRef("foo", "1", "2"))        .to.eql(["foo", "1"]);
			expect(resolveManRef("1", "foo", "2"))        .to.eql(["foo", "1"]);
			expect(resolveManRef("1", "2", "foo"))        .to.eql(["1",   "2"]);
			expect(resolveManRef("foo", "1", "bar", "2")) .to.eql(["foo", "1"]);
			expect(resolveManRef("foo", "bar", "1", "2")) .to.eql(["foo", "bar"]);
		});
	});
});
