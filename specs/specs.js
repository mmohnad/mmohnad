/* global jasmine, describe, it, xit , expect, Fingerprint2 */
'use strict'

function getComponent (components, key) {
  for (var x = 0; x < components.length; x++) {
    if (components[x].key === key) {
      return components[x].value
    }
  }
  throw new Error('Component not found: ' + key)
}

var onPhantomJs = window._phantom != null

describe('Fingerprint2', function () {
  describe('new', function () {
    it('creates a new instance of FP2', function () {
      expect(new Fingerprint2()).not.toBeNull()
    })

    it('accepts an empty options object', function () {
      expect(new Fingerprint2({})).not.toBeNull()
    })

    // options is not accessible anymore
    xit('uses default options', function () {
      var fp2 = new Fingerprint2()
      expect(fp2.options.swfContainerId).toEqual('fingerprintjs2')
      expect(fp2.options.swfPath).toEqual('flash/compiled/FontList.swf')
      expect(fp2.options.userDefinedFonts).toEqual([])
    })

    xit('allows to override default options', function () {
      var fp2 = new Fingerprint2({swfPath: 'newpath', userDefinedFonts: ['Ethos', 'Quenda']})
      expect(fp2.options.swfContainerId).toEqual('fingerprintjs2')
      expect(fp2.options.swfPath).toEqual('newpath')
      expect(fp2.options.userDefinedFonts).toEqual(['Ethos', 'Quenda'])
    })

    xit('allows to add new options', function () {
      var fp2 = new Fingerprint2({excludeUserAgent: true})
      expect(fp2.options.swfContainerId).toEqual('fingerprintjs2')
      expect(fp2.options.swfPath).toEqual('flash/compiled/FontList.swf')
      expect(fp2.options.excludeUserAgent).toBe(true)
    })

    describe('sortPluginsFor', function () {
      xit('has default value', function () {
        var fp2 = new Fingerprint2()
        expect(fp2.options.sortPluginsFor).toEqual([/palemoon/i])
      })

      xit('allows to set new array of regexes', function () {
        var fp2 = new Fingerprint2({sortPluginsFor: [/firefox/i, /chrome/i]})
        expect(fp2.options.sortPluginsFor).toEqual([/firefox/i, /chrome/i])
      })
    })
  })

  describe('without new keyword', function () {
    it('creates a new instance of FP2', function () {
      expect(Fingerprint2()).not.toBeNull()
    })
  })

  describe('FP2', function () {
    it('.get should be available', function () {
      expect(Fingerprint2.get).toBeDefined()
    })
    it('.getPromise should be available', function () {
      expect(Fingerprint2.getPromise).toBeDefined()
    })
  })

  describe('get', function () {
    describe('default options', function () {
      it('calculates fingerprint', function (done) {
        var fp2 = new Fingerprint2()
        fp2.get(function (result) {
          expect(result).toMatch(/^[0-9a-f]{32}$/i)
          done()
        })
      })

      it('does not try calling flash font detection', function (done) {
        var flashFontKey = 'fontsFlash'
        var fp2 = new Fingerprint2()
        fp2.get(function (result, components) {
          expect(components.some(function (componentResult) {
            return componentResult.key === flashFontKey
          })).toBeFalse()
          done()
        })
      })
    })

    describe('excludes work:', function () {
      [
        'userAgent',
        'pixelRatio',
        'deviceMemory',
        'screenResolution',
        'availableScreenResolution',
        'plugins',
        'timezone'
      ].forEach(function (key) {
        it('does not use ' + key + ' when excluded', function (done) {
          var fp2 = new Fingerprint2({excludes: [key]})
          fp2.get(function (result, components) {
            expect(components.some(function (componentResult) {
              return componentResult.key === key
            })).toBeFalse()
            done()
          })
        })
      })
    })

      // navigator.appName is read only
    xit('does not use IE plugins info when excluded', function (done) {
      var previous = navigator.appName
      navigator.appName = 'Microsoft Internet Explorer'
      var key = 'plugins'
      var fp2 = new Fingerprint2({excludeIEPlugins: true})
      fp2.get(function (result, components) {
        expect(components.some(function (componentResult) {
          return componentResult.key === key
        })).toBeFalse()
        navigator.appName = previous
        done()
      })
    })

    describe('returns components', function () {
      it('does it return components as a second argument to callback', function (done) {
        var fp2 = new Fingerprint2()
        fp2.get(function (result, components) {
          expect(components).not.toBeNull()
          done()
        })
      })

      it('checks if returned components is array', function (done) {
        var fp2 = new Fingerprint2()
        fp2.get(function (result, components) {
          expect(components).toBeArrayOfObjects()
          done()
        })
      })

      it('checks if fonts component is array', function (done) {
        (new Fingerprint2()).get(function (_, components) {
          expect(getComponent(components, 'fonts')).toBeArray()
          done()
        })
      })

      it('returns userAgent as the first element', function (done) {
        var fp2 = new Fingerprint2()
        fp2.get(function (result, components) {
          expect(components[0].key).toEqual('userAgent')
          done()
        })
      })
    })

    describe('baseFontArray iteration', function () {
      it('only iterates specified items', function (done) {
        var baseFonts = ['monospace', 'sans-serif', 'serif']
        // eslint-disable-next-line
        var ctr = 0; for (var _ in baseFonts) { ctr++ }

        expect(baseFonts.length).toEqual(3)
        expect(ctr).toEqual(baseFonts.length)

        // Somewhere deep in your JavaScript library...
        // eslint-disable-next-line
        Array.prototype.foo = 1
        // eslint-disable-next-line
        Array.prototype.bar = 2
        // eslint-disable-next-line
        ctr = 0; for (var _ in baseFonts) {
          ctr++
          // Now foo & bar is a part of EVERY array and
          // will show up here as a value of 'x'.
        }

        expect(baseFonts.length).toEqual(3)
        // sadface
        expect(ctr).not.toEqual(baseFonts.length)
        expect(ctr).toEqual(5)
        done()
      })
    })

    describe('userDefinedFonts option', function () {
      it('concatinates existing fonts with user-defined', function (done) {
        var fontList = [
          'Andale Mono', 'Arial', 'Arial Black', 'Arial Hebrew', 'Arial MT', 'Arial Narrow', 'Arial Rounded MT Bold',
          'Arial Unicode MS',
          'Bitstream Vera Sans Mono', 'Book Antiqua', 'Bookman Old Style',
          'Calibri', 'Cambria', 'Cambria Math', 'Century', 'Century Gothic', 'Century Schoolbook', 'Comic Sans',
          'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
          'Garamond', 'Geneva', 'Georgia',
          'Helvetica', 'Helvetica Neue',
          'Impact',
          'Lucida Bright', 'Lucida Calligraphy', 'Lucida Console', 'Lucida Fax', 'LUCIDA GRANDE', 'Lucida Handwriting',
          'Lucida Sans', 'Lucida Sans Typewriter', 'Lucida Sans Unicode',
          'Microsoft Sans Serif', 'Monaco', 'Monotype Corsiva', 'MS Gothic', 'MS Outlook', 'MS PGothic',
          'MS Reference Sans Serif', 'MS Sans Serif', 'MS Serif', 'MYRIAD', 'MYRIAD PRO',
          'Palatino', 'Palatino Linotype',
          'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Segoe UI Symbol',
          'Tahoma', 'Times', 'Times New Roman', 'Times New Roman PS', 'Trebuchet MS',
          'Verdana', 'Wingdings', 'Wingdings 2', 'Wingdings 3'
        ]

        expect(fontList.length).toEqual(65)
        var userDefinedFonts = []
        fontList.concat(userDefinedFonts)
        expect(fontList.length).toEqual(65)

        userDefinedFonts = ['Adria Grotesk', 'Butler', 'Nimbus Mono', 'Arial', 'Nimbus Mono']
        expect(userDefinedFonts.length).toEqual(5)
        fontList = fontList.concat(userDefinedFonts)

        // remove duplicate fonts: "Arial" from default fonts & duplicate "Nimbus Mono" from `userDefinedFonts` variable.
        fontList = fontList.filter(function (font, position) {
          return fontList.indexOf(font) === position
        })

        expect(fontList.length).toEqual(65 + 5 - 2)
        done()
      })
    })
    describe('extraComponents option', function () {
      it('uses extraComponents', function (done) {
        function customFunction (done) {
          done('RANDOM_STRING')
        }

        var spy = jasmine.createSpy('customFunction', customFunction).and.callThrough()
        var fp = new Fingerprint2({
          extraComponents: [{key: 'customFunction', getData: spy}]
        })
        fp.get(function (result, keys) {
          expect(spy).toHaveBeenCalled()
          done()
        })
      })
      it('its key is used', function (done) {
        var fp = new Fingerprint2({
          extraComponents: [
            {
              key: 'TEST_STRING',
              getData: function customFunction (done) {
                done('RANDOM_STRING')
              }
            }
          ]
        })
        fp.get(function (_, components) {
          expect(getComponent(components, 'TEST_STRING')).toEqual('RANDOM_STRING')
          done()
        })
      })

      it('safely introduce a new component even if it throws', function (done) {
        var fp = new Fingerprint2({
          extraComponents: [
            {
              key: 'my key',
              getData: function customFunction (done) {
                throw new Error('unstable component')
              }
            }
          ]
        })
        fp.get(function (_, components) {
          // if we arrive here, it means the rest of the fingerprint was not disturbed
          expect(components).toBeDefined()
          done()
        })
      })
    })

    if (!onPhantomJs) {
      describe('enumerate devices fingerprint', function () {
        it('checks enumerate devices fingerprint', function (done) {
          var fp2 = new Fingerprint2({excludes: []})
          fp2.get(function (_, components) {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
              expect(getComponent(components, 'enumerateDevices')).not.toBeNull()
            }
            done()
          })
        })
      })
    }

    if (!onPhantomJs) {
      describe('audio fingerprint', function () {
        it('checks audio fingerprint', function (done) {
          (new Fingerprint2()).get(function (_, components) {
            expect(getComponent(components, 'audio')).not.toBeNull()
            done()
          })
        })
      })
    }

    if (!onPhantomJs) {
      describe('webgl shader precision format', function () {
        // fp2.getWebglCanvas() no longer exposed
        xit('checks webgl shader precision format loop', function (done) {
          var fp2 = new Fingerprint2()
          fp2.get(function (_, components) {
            getComponent(components, 'webgl')
          })
          var gl = fp2.getWebglCanvas()
          var item = function (name, descr, attr1, attr2, attr3) {
            var fmt = gl.getShaderPrecisionFormat(attr1, attr2)[attr3]
            return ['webgl ', name, ' shader ', descr, ':', fmt].join('')
          }
          var webglExpectedArray = [ /* eslint-disable */
            item('vertex'  , 'high float precision'           , gl.VERTEX_SHADER  , gl.HIGH_FLOAT  , 'precision'),
            item('vertex'  , 'high float precision rangeMin'  , gl.VERTEX_SHADER  , gl.HIGH_FLOAT  , 'rangeMin'),
            item('vertex'  , 'high float precision rangeMax'  , gl.VERTEX_SHADER  , gl.HIGH_FLOAT  , 'rangeMax'),
            item('vertex'  , 'medium float precision'         , gl.VERTEX_SHADER  , gl.MEDIUM_FLOAT, 'precision'),
            item('vertex'  , 'medium float precision rangeMin', gl.VERTEX_SHADER  , gl.MEDIUM_FLOAT, 'rangeMin'),
            item('vertex'  , 'medium float precision rangeMax', gl.VERTEX_SHADER  , gl.MEDIUM_FLOAT, 'rangeMax'),
            item('vertex'  , 'low float precision'            , gl.VERTEX_SHADER  , gl.LOW_FLOAT   , 'precision'),
            item('vertex'  , 'low float precision rangeMin'   , gl.VERTEX_SHADER  , gl.LOW_FLOAT   , 'rangeMin'),
            item('vertex'  , 'low float precision rangeMax'   , gl.VERTEX_SHADER  , gl.LOW_FLOAT   , 'rangeMax'),
            item('vertex'  , 'high int precision'             , gl.VERTEX_SHADER  , gl.HIGH_INT    , 'precision'),
            item('vertex'  , 'high int precision rangeMin'    , gl.VERTEX_SHADER  , gl.HIGH_INT    , 'rangeMin'),
            item('vertex'  , 'high int precision rangeMax'    , gl.VERTEX_SHADER  , gl.HIGH_INT    , 'rangeMax'),
            item('vertex'  , 'medium int precision'           , gl.VERTEX_SHADER  , gl.MEDIUM_INT  , 'precision'),
            item('vertex'  , 'medium int precision rangeMin'  , gl.VERTEX_SHADER  , gl.MEDIUM_INT  , 'rangeMin'),
            item('vertex'  , 'medium int precision rangeMax'  , gl.VERTEX_SHADER  , gl.MEDIUM_INT  , 'rangeMax'),
            item('vertex'  , 'low int precision'              , gl.VERTEX_SHADER  , gl.LOW_INT     , 'precision'),
            item('vertex'  , 'low int precision rangeMin'     , gl.VERTEX_SHADER  , gl.LOW_INT     , 'rangeMin'),
            item('vertex'  , 'low int precision rangeMax'     , gl.VERTEX_SHADER  , gl.LOW_INT     , 'rangeMax'),
            item('fragment', 'high float precision'           , gl.FRAGMENT_SHADER, gl.HIGH_FLOAT  , 'precision'),
            item('fragment', 'high float precision rangeMin'  , gl.FRAGMENT_SHADER, gl.HIGH_FLOAT  , 'rangeMin'),
            item('fragment', 'high float precision rangeMax'  , gl.FRAGMENT_SHADER, gl.HIGH_FLOAT  , 'rangeMax'),
            item('fragment', 'medium float precision'         , gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT, 'precision'),
            item('fragment', 'medium float precision rangeMin', gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT, 'rangeMin'),
            item('fragment', 'medium float precision rangeMax', gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT, 'rangeMax'),
            item('fragment', 'low float precision'            , gl.FRAGMENT_SHADER, gl.LOW_FLOAT   , 'precision'),
            item('fragment', 'low float precision rangeMin'   , gl.FRAGMENT_SHADER, gl.LOW_FLOAT   , 'rangeMin'),
            item('fragment', 'low float precision rangeMax'   , gl.FRAGMENT_SHADER, gl.LOW_FLOAT   , 'rangeMax'),
            item('fragment', 'high int precision'             , gl.FRAGMENT_SHADER, gl.HIGH_INT    , 'precision'),
            item('fragment', 'high int precision rangeMin'    , gl.FRAGMENT_SHADER, gl.HIGH_INT    , 'rangeMin'),
            item('fragment', 'high int precision rangeMax'    , gl.FRAGMENT_SHADER, gl.HIGH_INT    , 'rangeMax'),
            item('fragment', 'medium int precision'           , gl.FRAGMENT_SHADER, gl.MEDIUM_INT  , 'precision'),
            item('fragment', 'medium int precision rangeMin'  , gl.FRAGMENT_SHADER, gl.MEDIUM_INT  , 'rangeMin'),
            item('fragment', 'medium int precision rangeMax'  , gl.FRAGMENT_SHADER, gl.MEDIUM_INT  , 'rangeMax'),
            item('fragment', 'low int precision'              , gl.FRAGMENT_SHADER, gl.LOW_INT     , 'precision'),
            item('fragment', 'low int precision rangeMin'     , gl.FRAGMENT_SHADER, gl.LOW_INT     , 'rangeMin'),
            item('fragment', 'low int precision rangeMax'     , gl.FRAGMENT_SHADER, gl.LOW_INT     , 'rangeMax'),
          ]

          fp2.get(function (_, components) {
            webglExpectedArray.forEach(function (item) {
              expect(getComponent(components, 'webgl').indexOf(item)).not.toEqual(-1)
            })
            done()
          })
        })
      })
    }

    describe('preprocessor', function () {
      it('checks that preprocessor not used by default', function (done) {
        (new Fingerprint2()).get(function (_, components) {
          expect(getComponent(components, 'userAgent')).not.toEqual('MyUserAgent')
          done()
        })
      })

      it('checks that preprocessor function applied to component value', function (done) {
        var mykey = 'userAgent'
        var options = {
          preprocessor: function (key, value) {
            if (key === mykey) {
              return 'MyUserAgent'
            }
            return value
          }
        }
        var fp2 = new Fingerprint2(options)
        fp2.get(function (_, components) {
          expect(getComponent(components, mykey)).toEqual('MyUserAgent')
          done()
        })
      })
    })
    
    if (!onPhantomJs) {
      describe('extra', function () {
        //https://github.com/jsdom/jsdom/blob/master/lib/jsdom/living/navigator/NavigatorPlugins-impl.js
        it('should no throw in jsdom like environment', function (done) {
          // direct assignment does not work
          Object.defineProperty(navigator, "plugins", {
            value: {
              javaEnabled: function () {
                return false
              }
            }
          })
          new Fingerprint2().get(function (_, components) {
            expect(getComponent(components, 'plugins')).toBeDefined()
            done()
          })
        })
      })
    }

  })
})
