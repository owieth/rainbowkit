import React, { createContext, ReactNode, useContext } from 'react';
import { useAccount } from 'wagmi';
import { cssStringFromTheme } from '../../css/cssStringFromTheme';
import { largeScreenMinWidth, ThemeVars } from '../../css/sprinkles.css';
import { useWindowSize } from '../../hooks/useWindowSize';
import { lightTheme } from '../../themes/lightTheme';
import { TransactionStoreProvider } from '../../transactions/TransactionStoreContext';
import { AppContext, defaultAppInfo, DisclaimerComponent } from './AppContext';
import { AvatarComponent, AvatarContext, defaultAvatar } from './AvatarContext';
import { CoolModeContext } from './CoolModeContext';
import { ModalProvider } from './ModalContext';
import {
  ModalSizeContext,
  ModalSizeOptions,
  ModalSizes,
} from './ModalSizeContext';
import {
  RainbowKitChain,
  RainbowKitChainProvider,
} from './RainbowKitChainContext';
import { ShowRecentTransactionsContext } from './ShowRecentTransactionsContext';
import { usePreloadImages } from './usePreloadImages';
import { clearWalletConnectDeepLink } from './walletConnectDeepLink';

const ThemeIdContext = createContext<string | undefined>(undefined);

const attr = 'data-rk';

const createThemeRootProps = (id: string | undefined) => ({ [attr]: id || '' });

const createThemeRootSelector = (id: string | undefined) => {
  if (id && !/^[a-zA-Z0-9_]+$/.test(id)) {
    throw new Error(`Invalid ID: ${id}`);
  }

  return id ? `[${attr}="${id}"]` : `[${attr}]`;
};

export const useThemeRootProps = () => {
  const id = useContext(ThemeIdContext);
  return createThemeRootProps(id);
};

export type Theme =
  | ThemeVars
  | {
    lightMode: ThemeVars;
    darkMode: ThemeVars;
  };

export interface RainbowKitProviderProps {
  chains: RainbowKitChain[];
  initialChain?: RainbowKitChain | number;
  id?: string;
  children: ReactNode;
  theme?: Theme | null;
  showRecentTransactions?: boolean;
  appInfo?: {
    appName?: string;
    learnMoreUrl?: string;
    disclaimer?: DisclaimerComponent;
  };
  coolMode?: boolean;
  avatar?: AvatarComponent;
  modalSize?: ModalSizes;
  token?: {
    chain: number;
    address: string;
  }[];
}

const defaultTheme = lightTheme();

export function RainbowKitProvider({
  chains,
  initialChain,
  id,
  theme = defaultTheme,
  children,
  appInfo,
  showRecentTransactions = false,
  coolMode = false,
  avatar,
  modalSize = ModalSizeOptions.WIDE,
  token,
}: RainbowKitProviderProps) {
  usePreloadImages();

  useAccount({ onDisconnect: clearWalletConnectDeepLink });

  if (typeof theme === 'function') {
    throw new Error(
      'A theme function was provided to the "theme" prop instead of a theme object. You must execute this function to get the resulting theme object.'
    );
  }

  const selector = createThemeRootSelector(id);

  const appContext = {
    ...defaultAppInfo,
    ...appInfo,
  };

  const avatarContext = avatar ?? defaultAvatar;

  const { width } = useWindowSize();
  const isSmallScreen = width && width < largeScreenMinWidth;

  return (
    <RainbowKitChainProvider chains={chains} initialChain={initialChain}>
      <CoolModeContext.Provider value={coolMode}>
        <ModalSizeContext.Provider
          value={isSmallScreen ? ModalSizeOptions.COMPACT : modalSize}
        >
          <ShowRecentTransactionsContext.Provider
            value={showRecentTransactions}
          >
            <TransactionStoreProvider>
              <AvatarContext.Provider value={avatarContext}>
                <AppContext.Provider value={appContext}>
                  <ThemeIdContext.Provider value={id}>
                    <ModalProvider token={token}>
                      {theme ? (
                        <div {...createThemeRootProps(id)}>
                          <style
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{
                              // Selectors are sanitized to only contain alphanumeric
                              // and underscore characters. Theme values generated by
                              // cssStringFromTheme are sanitized, removing
                              // characters that terminate values / HTML tags.
                              __html: [
                                `${selector}{${cssStringFromTheme(
                                  'lightMode' in theme ? theme.lightMode : theme
                                )}}`,

                                'darkMode' in theme
                                  ? `@media(prefers-color-scheme:dark){${selector}{${cssStringFromTheme(
                                    theme.darkMode,
                                    { extends: theme.lightMode }
                                  )}}}`
                                  : null,
                              ].join(''),
                            }}
                          />
                          {children}
                        </div>
                      ) : (
                        children
                      )}
                    </ModalProvider>
                  </ThemeIdContext.Provider>
                </AppContext.Provider>
              </AvatarContext.Provider>
            </TransactionStoreProvider>
          </ShowRecentTransactionsContext.Provider>
        </ModalSizeContext.Provider>
      </CoolModeContext.Provider>
    </RainbowKitChainProvider>
  );
}
