const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, 'a user must have a name ']
  },
  email: {
    type: String,
    require: [true, 'a user must have an email '],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    require: [true, 'a user must have a password'],
    minlength: [8, 'a password must have more or equal then 8 characters'],
    select: false // this means that password will not be returned in the response
  },
  passwordConfirm: {
    type: String,
    require: [true, 'a user must confirm the password'],
    validate: {
      //  This only works on create and  SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false // this means that active will not be returned in the response
  }
});

userSchema.pre('save', async function(next) {
  // only run this function if password was modified
  if (!this.isModified('password')) return next();
  // hash the password with cost of 12
  // bcrypt.hash() returns a promise, so we use await
  this.password = await bcrypt.hash(this.password, 12);

  // delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this poitns to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // subtracting 1000 milliseconds to ensure the JWT is created after the password change
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken; // 10 minutes
};
const User = mongoose.model('User', userSchema);

module.exports = User;
