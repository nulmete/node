const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        creator: {
            // reference to a User
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        // add 'createdAt' and 'updatedAt' timestamps when creating/updating
        timestamps: true
    }
);

module.exports = mongoose.model('Post', postSchema);
