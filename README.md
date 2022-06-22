# @dashx/web

_DashX JS SDK for the browser_

<p>
  <a href="/LICENSE">
    <img src="https://badgen.net/badge/license/MIT/blue" alt="license"/>
  </a>
</p>

## Install

```sh
# via npm
$ npm install @dashx/web

# via yarn
$ yarn add @dashx/web
```

## Usage

```javascript
import DashX from '@dashx/web';

const dx = DashX({ publicKey: 'your_public_key' });
```

`DashX` constructor accepts following properties:

|Name|Type|
|:---:|:--:|
|**`publicKey`**|`string` _(Required)_ |
|**`baseUri`**|`string`|

By default the value of `baseUri` is `https://api.dashx.com/v1`

### Identify User

- Existing user

```javascript
dx.identify('uid_of_user');
```

- New user

```javascript
dx.identify({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1-234-567-8910'
});
```

For new user `identify()` accepts following properties:

|Name|Type|
|:---:|:--:|
|**`firstName`**|`string`|
|**`lastName`**|`string`|
|**`email`**|`string`|
|**`phone`**|`string`|

*Please note that `identify()` should not be called with `null` or `undefined`*

### Search Content

```javascript
dx.searchContent('content_type', { returnType: 'all', limit: 10 } /* Content Options */)
  .then(data => console.log(data));
```

Content Options can include following properties:

|Name|Type|Example|
|:--:|:--:|:-----:|
|**`language`**|`string`|`'en_US'`||
|**`include`**|`array`|`['character.createdBy', 'character.birthDate']`||
|**`exclude`**|`array`|`['directors']`||
|**`fields`**|`array`|`['character', 'cast']`||
|**`preview`**|`boolean`||
|**`returnType`**|`'all'` or `'one'`||
|**`filter`**|`object`|`{ name_eq: 'John' }`|
|**`order`**|`object`|`{ created_at: 'DESC' }`|
|**`limit`**|`number`||
|**`page`**|`number`||

For example, to get latest contacts with name 'John' you can do:

```javascript
dx.searchContent('contacts')
  .filter({ name_eq: 'John' })
  .order({ created_at: 'DESC' })
  .preview() // Sets preview to true
  .limit(10)
  .all() /* returnType */
```

This code is lazy by default and will not be executed until `.all()` or `.one()` is called.
Hence `.all()` or `.one()` should be used at the end of chain.

The above code can also be written as:

```javascript
dx.searchContent('contacts', {
  returnType: 'all',
  filter: {
    name_eq: 'John'
  },
  order: {
    created_at: 'DESC'
  },
  preview: true,
  limit: 10
});
```

### Fetch Content

```javascript
dx.fetchContent('content_type/content', { language: 'en_US' } /* Fetch Content Options */)
  .then(data => console.log(data));
```

Fetch Content Options can include following properties:

|Name|Type|Example|
|:--:|:--:|:-----:|
|**`language`**|`string`|`'en_US'`||
|**`include`**|`array`|`['character.createdBy', 'character.birthDate']`||
|**`exclude`**|`array`|`['directors']`||
|**`fields`**|`array`|`['character', 'cast']`||
|**`preview`**|`boolean`||

```javascript
dx.fetchContent('movies/avengers', {
  language: 'en_US',
  include: ['character.created_by'],
  exclude: ['directors'],
  fields: ['character', 'release_date'],
  preview: true
});
```

### Track Events

```javascript
dx.track('event_name', { hello: 'world' } /* Event data */);
```

### Reset User

`reset()` clears out the information associated with a user. *Must* be called after a user logs out.

```javascript
dx.reset();
```

## Development

- Make sure all the dependencies are installed:

```sh
$ lerna bootstrap
```

- To start dev server with hot reload: 

```sh
$ yarn start
```

This will run a dev server that logs out errors and warnings and reloads itself on any file save.

- To create production build:

```sh
yarn build
```

- To publish package, make sure to login on npm cli and commit all the changes before running this:

```sh
yarn publish
git push origin master
```
