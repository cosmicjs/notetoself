# Note to Self
![Note App](https://cosmicjs.com/uploads/3e233540-2d5e-11e7-b637-1d1d0fc1eab1-note-app.jpg)
## Getting Started
1. Go to [Cosmic JS](https://cosmicjs.com) and create a new Bucket.
2. Download the Note to Self repo:
```
git clone https://github.com/cosmicjs/notetoself
cd notetoself
yarn
```

## Starting the app
1. Edit the config part of `index.js` to point to your Cosmic JS Bucket Slug
```
config.bucket = {
  slug: 'your-bucket-slug', // add your slug here
  read_key: '',
  write_key: ''
}
```
2. Install the app globally
```
npm install -g
```
3. Anywhere view / create / edit / delete notes with the following command:
```
notetoself
```
