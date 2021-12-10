import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {RootState} from '../../app/store';

import {fetchTokens, fetchWallet, mintRequest, mintWrapper, registerWallet, sendAction} from "./tokenAPI";
import {Token, Step, RegistrationRequestObject, PresignRequestObject, MintRequest} from "../../app/types";
import {create} from "domain";

// This is a slice of our overall redux state tree
// This attempts to follow idiomatic redux patterns with RTK, and is as such not commented heavily

export interface TokenState {
  status: 'idle' | 'loading' | 'failed';
  step: Step;
  tokens: Token[];
  response: object;
  error: boolean;
  ready: boolean;
  walletConnected: boolean;
  walletAddress: string | null;
  mintRequest: MintRequest | null;
}

const initialState: TokenState = {
  status: 'idle',
  step: Step.REGISTER,
  tokens: [],
  response: {},
  error: false,
  ready: false,
  walletConnected: false,
  walletAddress: null,
  mintRequest: null
};

export const getTokens = createAsyncThunk('tokens/getTokens', async (defaultParam: null, thunkAPI): Promise<Token[]> => {
  const response = await fetchTokens()

  // @ts-ignore
  if (!response.ok) {
    thunkAPI.dispatch(setError(true));
  } else {
    thunkAPI.dispatch(setError(false));
    thunkAPI.dispatch(setReady(true))
  }

  // @ts-ignore
  return await response.json()
})

export const getWallet = createAsyncThunk('tokens/getWallet', async (defaultParam: null, thunkAPI) => {
  const response = await fetchWallet();

  // @ts-ignore
  if (!response.ok) {
    thunkAPI.dispatch(setWalletConnected(false))
    thunkAPI.dispatch(setReady(false))
  } else {
    // @ts-ignore
    const { address, signature } = await response.json()

    thunkAPI.dispatch(setWalletConnected(true))
    thunkAPI.dispatch(setReady(true))
    thunkAPI.dispatch(setWalletAddress(address))
  }
})

export const register = createAsyncThunk('tokens/register', async (registrationObject: RegistrationRequestObject, thunkAPI) => {
  const { email, discord, twitter } = registrationObject;
  const response = await registerWallet(email, discord, twitter)

  // @ts-ignore
  if (!response.ok) {
    thunkAPI.dispatch(setError(true));
  } else {
    thunkAPI.dispatch(setError(false));
    thunkAPI.dispatch(setReady(true))
  }

  // @ts-ignore
  return await response.json()
})

export const presignMintRequest = createAsyncThunk('tokens/presign', async (presignObject: PresignRequestObject, thunkAPI) => {
  // Expire old object
  thunkAPI.dispatch(setMintRequest(null))

  const { quantity } = presignObject;
  const response = await mintRequest(quantity)

  // @ts-ignore
  if (!response.ok) {
    thunkAPI.dispatch(setError(true));
  } else {
    thunkAPI.dispatch(setError(false));
    thunkAPI.dispatch(setReady(true))
  }

  // @ts-ignore
  return await response.json()
})

export const mint = createAsyncThunk('tokens/mint', async (mintRequest: MintRequest|null, thunkAPI) => {
  let success: boolean;
  if (mintRequest !== null) {
    console.log("Here")
    success = await mintWrapper(mintRequest)
  } else {
    success = false;
  }
  return success;
})

export const tokenSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<Step>) => {
      state.step = action.payload
    },
    setResponse: (state, action:PayloadAction<object>) => {
      state.response = action.payload
    },
    setError: (state, action: PayloadAction<boolean>) => {
      state.error = action.payload
    },
    setReady: (state, action: PayloadAction<boolean>) => {
      state.ready = action.payload
    },
    setWalletConnected : (state, action: PayloadAction<boolean>) => {
      state.walletConnected = action.payload
    },
    setWalletAddress: (state, action:PayloadAction<string|null>) => {
      state.walletAddress = action.payload
    },
    setMintRequest: (state, action:PayloadAction<MintRequest|null>) => {
      state.mintRequest = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTokens.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getTokens.fulfilled, (state, action) => {
        state.status = 'idle'
        state.tokens = action.payload
      })
      .addCase(getWallet.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getWallet.fulfilled, (state) => {
        state.status = 'idle'
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'idle'
        state.response = action.payload
      })
      .addCase(presignMintRequest.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(presignMintRequest.fulfilled, (state, action) => {
        state.status = 'idle'
        state.response = action.payload
        state.mintRequest = action.payload
      })
      .addCase(mint.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(mint.fulfilled, (state, action) => {
        state.status = 'idle'
        console.log("Mint Success:", action.payload)
      })
  }
})

export const { setStep, setResponse, setError, setReady, setWalletConnected, setWalletAddress, setMintRequest } = tokenSlice.actions;

export const selectStep = (state: RootState) => {
  return state.tokens.step
}

export const selectTokens = (state: RootState) => {
  return state.tokens.tokens
}

export const selectResponse = (state: RootState) => {
  return JSON.stringify(state.tokens.response, undefined, 2);
}

export const selectError = (state: RootState) => {
  return state.tokens.error
}

export const selectReady = (state: RootState) => {
  return state.tokens.ready
}

export const selectWalletConnected = (state: RootState) => {
  return state.tokens.walletConnected
}

export const selectWalletAddress = (state: RootState) => {
  return state.tokens.walletAddress
}

export const selectMintRequest = (state: RootState) => {
  return state.tokens.mintRequest
}

export default tokenSlice.reducer
