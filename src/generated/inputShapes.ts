 
export type InputScalar = 'Boolean' | 'Decimal' | 'Float' | 'Int' | 'JSON' | 'String' | 'Timestamp'

export type InputField = { required: boolean, scalar: InputScalar } | { required: boolean, fields: InputShape }

export type InputShape = { [field: string]: InputField }

export const TrackedEventInputShape: InputShape = {
  'accountAnonymousUid': {
    'required': false,
    'scalar': 'String'
  },
  'accountUid': {
    'required': false,
    'scalar': 'String'
  },
  'data': {
    'required': false,
    'scalar': 'JSON'
  },
  'event': {
    'required': true,
    'scalar': 'String'
  },
  'systemContext': {
    'required': false,
    'fields': {
      'app': {
        'required': false,
        'fields': {
          'build': {
            'required': true,
            'scalar': 'String'
          },
          'name': {
            'required': true,
            'scalar': 'String'
          },
          'namespace': {
            'required': true,
            'scalar': 'String'
          },
          'version': {
            'required': true,
            'scalar': 'String'
          }
        }
      },
      'campaign': {
        'required': false,
        'fields': {
          'content': {
            'required': true,
            'scalar': 'String'
          },
          'medium': {
            'required': true,
            'scalar': 'String'
          },
          'name': {
            'required': true,
            'scalar': 'String'
          },
          'source': {
            'required': true,
            'scalar': 'String'
          },
          'term': {
            'required': true,
            'scalar': 'String'
          }
        }
      },
      'device': {
        'required': false,
        'fields': {
          'adTrackingEnabled': {
            'required': true,
            'scalar': 'Boolean'
          },
          'advertisingId': {
            'required': true,
            'scalar': 'String'
          },
          'id': {
            'required': true,
            'scalar': 'String'
          },
          'kind': {
            'required': true,
            'scalar': 'String'
          },
          'manufacturer': {
            'required': true,
            'scalar': 'String'
          },
          'model': {
            'required': true,
            'scalar': 'String'
          },
          'name': {
            'required': true,
            'scalar': 'String'
          }
        }
      },
      'ipV4': {
        'required': true,
        'scalar': 'String'
      },
      'ipV6': {
        'required': false,
        'scalar': 'String'
      },
      'library': {
        'required': false,
        'fields': {
          'name': {
            'required': true,
            'scalar': 'String'
          },
          'version': {
            'required': true,
            'scalar': 'String'
          }
        }
      },
      'locale': {
        'required': true,
        'scalar': 'String'
      },
      'location': {
        'required': false,
        'fields': {
          'city': {
            'required': false,
            'scalar': 'String'
          },
          'country': {
            'required': false,
            'scalar': 'String'
          },
          'latitude': {
            'required': false,
            'scalar': 'Decimal'
          },
          'longitude': {
            'required': false,
            'scalar': 'Decimal'
          },
          'speed': {
            'required': false,
            'scalar': 'Decimal'
          }
        }
      },
      'network': {
        'required': false,
        'fields': {
          'bluetooth': {
            'required': true,
            'scalar': 'Boolean'
          },
          'carrier': {
            'required': true,
            'scalar': 'String'
          },
          'cellular': {
            'required': true,
            'scalar': 'Boolean'
          },
          'wifi': {
            'required': true,
            'scalar': 'Boolean'
          }
        }
      },
      'os': {
        'required': false,
        'fields': {
          'name': {
            'required': true,
            'scalar': 'String'
          },
          'version': {
            'required': true,
            'scalar': 'String'
          }
        }
      },
      'page': {
        'required': false,
        'fields': {
          'path': {
            'required': true,
            'scalar': 'String'
          },
          'referrer': {
            'required': false,
            'scalar': 'String'
          },
          'title': {
            'required': false,
            'scalar': 'String'
          },
          'url': {
            'required': true,
            'scalar': 'String'
          }
        }
      },
      'screen': {
        'required': false,
        'fields': {
          'density': {
            'required': true,
            'scalar': 'Float'
          },
          'height': {
            'required': true,
            'scalar': 'Int'
          },
          'width': {
            'required': true,
            'scalar': 'Int'
          }
        }
      },
      'sessionId': {
        'required': false,
        'scalar': 'String'
      },
      'timeZone': {
        'required': true,
        'scalar': 'String'
      },
      'userAgent': {
        'required': true,
        'scalar': 'String'
      }
    }
  },
  'timestamp': {
    'required': false,
    'scalar': 'Timestamp'
  }
}