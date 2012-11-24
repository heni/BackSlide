## BackSlide - Development

All the development will take place on the `dev`-branch. **Don't** install the extension from this branch **unless**:

 1. you're a developer
 2. you where told so
 3. you know what you're doing

The branch is not considered stable!

### Development workflow

Here is the basic workflow for adding new features/fixing bugs:

 1. Create an issue and choose and appropriate kind
 2. Create a new topic-branch, based on the `dev`-branch
 3. Do the work on the topic branch and make sure everything works
 4. Send a pull-request from your topic-branch
 5. I'll test it myself and merge it into the `dev`-branch.
 6. At some point, when I feel the new features/bug fixes can be published, the dev-branch will be merged into `master` and the extension will be send for review.

### Tagging

Every new version that is send for review (and accepted) will be tagged with a running version-number of the form `v1.x`.
