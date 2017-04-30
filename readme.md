# Note to Self
![Note App](https://cosmicjs.com/uploads/58fb06b0-2dbb-11e7-826f-f34de0199ac5-note-to-self.png)
## Getting Started
1. Go to [Cosmic JS](https://cosmicjs.com) and create a new Bucket that will store your notes.
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
3. Now you can view / create / edit / delete notes with the following command:
```
notetoself
```
Your notes are now available to any device and any programming language through the [Cosmic JS API](https://cosmicjs.com).
