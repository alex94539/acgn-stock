'use strict';
import { dbCompanies } from '../db/dbCompanies';
import { dbDebugger } from '../db/dbDebugger';
import { dbDirectors } from '../db/dbDirectors';
import { dbFoundations } from '../db/dbFoundations';
import { dbInstantMessage } from '../db/dbInstantMessage';
import { dbLog } from '../db/dbLog';
import { dbOrders } from '../db/dbOrders';
import { dbPrice } from '../db/dbPrice';
import { dbProducts } from '../db/dbProducts';
import { dbResourceLock } from '../db/dbResourceLock';
import { dbSeason } from '../db/dbSeason';
import { dbValidatingUsers } from '../db/dbValidatingUsers';
import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  const now = new Date();
  dbCompanies.find().forEach((companyData) => {
    const companyName = companyData.companyName;
    if (dbFoundations.findOne({companyName})) {
      console.log('not insert company[' + companyName + '] because alread have in foundations.');
    }
    else {
      console.log('insert company[' + companyName + '] back into foundations.');
      dbFoundations.insert({
        companyName: companyName,
        manager: companyData.manager,
        tags: companyData.tags,
        pictureSmall: companyData.pictureSmall,
        pictureBig: companyData.pictureBig,
        description: companyData.description,
        invest: [],
        createdAt: now
      });
    }
  });
  dbCompanies.remove({});
  dbDebugger.remove({});
  dbDirectors.remove({});
  dbFoundations.find().forEach((foundationData) => {
    const companyName = foundationData.companyName;
    if (dbFoundations.find({companyName}).count() > 1) {
      console.log('remove foundations[' + companyName + '] because have same name foundations.');
      dbFoundations.remove(foundationData._id);
    }
    else if (typeof foundationData._id === 'string') {
      console.log('re insert foundations[' + companyName + '] because have incrorect _id.');
      dbFoundations.remove(foundationData._id);
      dbFoundations.insert({
        companyName: companyName,
        manager: foundationData.manager,
        tags: foundationData.tags,
        pictureSmall: foundationData.pictureSmall,
        pictureBig: foundationData.pictureBig,
        description: foundationData.description,
        invest: [],
        createdAt: now
      });
    }
  });
  dbFoundations.update(
    {},
    {
      $set: {
        invest: [],
        createdAt: now
      }
    },
    {
      multi: true
    }
  );
  dbInstantMessage.remove({});
  let stoneCount = 0;
  Meteor.users.find().forEach((userData) => {
    const logDataCursor = dbLog.find({
      username: userData.username,
      logType: {
        $nin: ['驗證通過', '發薪紀錄', '創立成功', '創立失敗', '創立得股', '免費得石']
      }
    });
    if (logDataCursor.count() > 0) {
      console.log('find user[' + userData.username + '] log data, increase stone by 1.');
      Meteor.users.update(userData._id, {
        $inc: {
          'profile.stone': 1
        }
      });
      stoneCount += 1;
    }
    else {
      console.log('user[' + userData.username + '] don\'t have log data.');
    }
  });
  console.log('total give ' + stoneCount + ' stones to ' + stoneCount + ' users!');
  dbLog.remove({});
  dbOrders.remove({});
  dbPrice.remove({});
  dbProducts.remove({});
  dbResourceLock.remove({});
  dbSeason.remove({});
  dbValidatingUsers.remove({});
  Meteor.users.update(
    {},
    {
      $set: {
        'profile.money': 10000
      }
    },
    {
      multi: true
    }
  );
  Meteor.users.find({}).forEach((user) => {
    console.log('reset insert log data of username[' + username + ']...');
    const username = user.username;
    dbLog.insert({
      logType: '驗證通過',
      username: [username],
      price: 10000,
      createdAt: new Date()
    });
    dbLog.insert({
      logType: '免費得石',
      username: [username],
      amount: user.profile.stone,
      message: '之前協助公測累積的石頭總數',
      createdAt: new Date()
    });
  });
  console.log('reset database done!');
});
