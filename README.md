![npm](https://img.shields.io/npm/v/@macloud-developer/inflow-source)
![NPM](https://img.shields.io/npm/l/@macloud-developer/inflow-source)

# inflow source
The path of a user to the site can be stored in and retrieved from localStorage.

# Installation
```shellsession
npm install @macloud-developer/inflow-source
yarn add @macloud-developer/inflow-source
```

# Usage
```typescript
import { useInflowSource } from '~/compositions/common/inflow-source'

const inflowSource = useInflowSource(window.localStorage)

inflowSource.set(
  currentDate, referrer,location.href
)
  
```

# node version

```shellsession
$ node --version
v16.13.2
$ npm --version
8.1.2
```
