# SafeReturn

SafeReturn is a tiny script that contains functional helpers for callback based code.

## Purpose

To make writing vanilla callback based code more enjoyable.

This package eases the pain, but still allows using free-form callbacks.

Libraries that attempt to manage your control-flow for you are doing it wrong.
Instead SafeReturn makes it easier to do it yourself the right way. 

Functions can be defined anywhere.  They are just values.  They close over
their local state and can carry it with them.  This is very powerful and simple!

Well formed async functions obey some additional rules:

 - Async functions must return either a value or error in the callback.
 - The callback must eventually fire and only once.
 - Async function must never throw exceptions except for argument errors.
 - ...

Writing the boilerplate to check these conditions is tedious and error-prone.
SafeReturn wants to help.

## Non-Goals

 - Not require any special syntax, function block, or indentation.  Must only
   consume a small amount of vertical space.
 - Not appear to be blocking or sequential in any way.  Better to embrace callbacks.
 
