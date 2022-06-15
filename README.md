https://img.shields.io/npm/v/@macloud-developer/inflow-source
https://img.shields.io/npm/l/@macloud-developer/inflow-source

# inflow source
The path of a user to the site can be stored in and retrieved from localStorage.

# Installation
npm install @macloud-developer/inflow-source
yarn add @macloud-developer/inflow-source


# Usage
```
import { useInflowSource } from '~/compositions/common/inflow-source'

const inflowSource = useInflowSource(window.localStorage)

inflowSource.set(
  currentDate, referrer,location.href
)
  
```

# node version

```
$ node --version
v16.13.2
$ npm --version
8.1.2
```
