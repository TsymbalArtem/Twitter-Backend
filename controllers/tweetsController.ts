/* eslint-disable class-methods-use-this */
import express from 'express';
import { validationResult } from 'express-validator';
import { ITweetModel, TweetModel } from '../models/tweetModel';
import { IUserModel } from '../models/userModel';
import handlerId from '../utils/handlerId';
import isValidObjectId from '../utils/isValidObjectId';

class TweetsController {
  async get(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const tweets = await TweetModel
        .find({})
        .populate('user')
        .populate({ path: 'retweet', populate: { path: 'user' } })
        .sort({ 'createdAt': '-1' })
        .exec();

      res.json({
        status: 'success',
        data: tweets,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async getById(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tweetId = req.params.id;

      if (!isValidObjectId(tweetId)) {
        res.status(400).send();
        return;
      }

      const tweet = await TweetModel
        .findById(tweetId)
        .populate('user')
        .populate({ path: 'retweet', populate: { path: 'user' } })
        .exec();

      if (!tweet) {
        res.status(404).send();
        return;
      }

      res.json({
        status: 'success',
        data: tweet,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async getUserTweets(req: express.Request, res: express.Response): Promise<void> {
    try {
      const userId = req.params.id;

      if (!isValidObjectId(userId)) {
        res.status(400).send();
        return;
      }

      const tweet = await TweetModel
        .find({ user: userId })
        .populate('user')
        .populate({ path: 'retweet', populate: { path: 'user' } })
        .sort({ 'createdAt': '-1' })
        .exec();

      if (!tweet) {
        res.status(404).send();
        return;
      }

      res.json({
        status: 'success',
        data: tweet,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async create(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as IUserModel;

      if (user?._id) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          res.status(400).json({ status: 'error', errors: errors.array() });
          return;
        }

        const data: ITweetModel = {
          text: req.body.text,
          images: req.body.images,
          user: user._id,
          likes: [],
          favorite: false,
        };

        if (req.body.retweet) {
          data.retweet = req.body.retweet;
        }

        const tweet = await TweetModel.create(data);

        user.tweets?.push(tweet._id);

        res.json({
          status: 'success',
          data: await tweet.populate('user').populate({ path: 'retweet', populate: { path: 'user' } }).execPopulate(),
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async update(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as IUserModel;

      if (user) {
        const tweetId = req.params.id;

        if (!isValidObjectId(tweetId)) {
          res.status(400).send();
          return;
        }

        const tweet = await TweetModel.findById(tweetId);

        if (tweet && typeof tweet.user === 'object') {
          if (String(tweet.user._id) === String(user._id)) {
            const { text } = req.body;
            tweet.text = text;
            tweet.save();
            res.send();
          } else {
            res.status(403).send();
          }
        } else {
          res.status(404).send();
        }
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async delete(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as IUserModel;

      if (user) {
        const tweetId = req.params.id;

        if (!isValidObjectId(tweetId)) {
          res.status(400).send();
          return;
        }

        const tweet = await TweetModel.findById(tweetId);

        if (tweet && typeof tweet.user === 'object') {
          if (String(tweet.user._id) === String(user._id)) {
            tweet.remove();
            res.send();
          } else {
            res.status(403).send();
          }
        } else {
          res.status(404).send();
        }
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async like(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tweetId = req.params.id;
      const { _id: userId } = req.user as IUserModel;

      if (!isValidObjectId(tweetId)) {
        res.status(400).send();
        return;
      }

      if (userId) {
        const tweet = await TweetModel
          .findById(tweetId)
          .populate('user')
          .populate({ path: 'retweet', populate: { path: 'user' } })
          .exec();

        if (tweet) {
          const indexOfId = handlerId.searchId(tweet.likes, userId.toString());

          if (indexOfId === -1) {
            tweet.likes = handlerId.insertId(userId, tweet.likes);
            tweet.favorite = true;
          } else {
            tweet.likes.splice(indexOfId, 1);
            tweet.favorite = false;
          }
          tweet.save();

          res.json({
            status: 'success',
            data: tweet,
          });
        } else {
          res.status(404).send();
        }
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }
}

export default new TweetsController();
