import * as React from 'react';

import { InteractableIdAttributeName } from './Interactable';
import { PressEventCoordinatesWithDeltas, PressHandlingOptions } from './PressInterpreter';
import { SpaceContext, SpaceContextType } from './SpaceContext';
import { generateRandomId } from './utils';
import { PressEventCoordinates } from './ViewPort';

const DEFAULT_LONG_TAP_THRESHOLD_MS: number = 500;

export const PRESSABLE_CSS_CLASS_NAME = `react-zoomable-ui-pressable`;

export interface PressableProps {
  readonly id?: string;
  readonly children?: React.ReactNode | ((state: PressableState) => React.ReactNode);
  readonly className?: string;
  readonly potentialTapClassName?: string;
  readonly potentialLongTapClassName?: string;
  readonly capturePressClassName?: string;
  readonly disabledClassName?: string;
  readonly hoverClassName?: string;
  readonly style?: React.CSSProperties;
  readonly potentialTapStyle?: React.CSSProperties;
  readonly potentialLongTapStyle?: React.CSSProperties;
  readonly capturePressStyle?: React.CSSProperties;
  readonly disabledStyle?: React.CSSProperties;
  readonly hoverStyle?: React.CSSProperties;

  readonly disabled?: boolean;
  readonly capturePressThresholdMs?: number;
  readonly longTapThresholdMs?: number;

  readonly onTap?: () => void;
  readonly onLongTap?: () => void;
  readonly onCapturePressStart?: (coordinates: PressEventCoordinates, pressableUnderlyingElement: HTMLElement) => void;
  readonly onCapturePressMove?: (
    coordinates: PressEventCoordinatesWithDeltas,
    pressableUnderlyingElement: HTMLElement,
    startingCoordinates: PressEventCoordinates,
  ) => void;
  readonly onCapturePressEnd?: (
    coordinates: PressEventCoordinatesWithDeltas,
    pressableUnderlyingElement: HTMLElement,
  ) => void;
  readonly onCapturePressCancelled?: (pressableUnderlyingElement: HTMLElement) => void;
  /**
   * Note this is actually called in an event handler in `Space`.
   */
  readonly onPressContextMenu?: (coordinates: PressEventCoordinates) => void;
}

export interface PressableState {
  readonly interaction: undefined | 'potential-tap' | 'potential-long-tap' | 'press-captured';
  readonly hovered: boolean;
}

export class Pressable extends React.PureComponent<PressableProps, PressableState> {
  public static contextType = SpaceContext;
  public readonly context!: SpaceContextType;
  public readonly divRef: React.RefObject<HTMLDivElement> = React.createRef();
  public readonly id = generateRandomId();
  public readonly state: PressableState = { interaction: undefined, hovered: false };

  private panStartingCoordinates?: PressEventCoordinates;

  public componentDidMount() {
    this.context.registerInteractable(this);
  }

  public componentWillUnmount() {
    this.context.unregisterInteractable(this);
  }

  public getPressHandlingConfig(): PressHandlingOptions | undefined {
    if (this.props.disabled) {
      return undefined;
    }

    return {
      onPotentialTap: this.handlePotentialTap,
      onTap: this.handleTap,
      longTapThresholdMs: this.props.onLongTap
        ? this.props.longTapThresholdMs ?? DEFAULT_LONG_TAP_THRESHOLD_MS
        : undefined,
      onPotentialLongTap: this.handlePotentialLongTap,
      onLongTap: this.handleLongTap,
      onTapAbandoned: this.handleTapAbandoned,
      capturePressThresholdMs: this.props.capturePressThresholdMs,
      onCapturePressStart: this.handleCapturePressStart,
      onCapturePressMove: this.handleCapturePressMove,
      onCapturePressEnd: this.handleCapturePressEnd,
      onCapturePressCancelled: this.handleCapturePressCancelled,
    };
  }

  public render() {
    return (
      <div
        {...{ [InteractableIdAttributeName]: this.id }}
        id={this.props.id}
        ref={this.divRef}
        className={this.determineClassName()}
        style={this.determineStyle()}
      >
        {typeof this.props.children === 'function' ? (this.props.children as any)(this.state) : this.props.children}
      </div>
    );
  }

  public setHovered(hovered: boolean) {
    this.setState({ hovered });
  }

  private determineClassName = () => {
    const { className } = this.props;
    let result = PRESSABLE_CSS_CLASS_NAME;
    if (className) {
      result += ' ';
      result += className;
    }

    if (this.props.disabled) {
      if (this.props.disabledClassName) {
        result += ' ';
        result += this.props.disabledClassName;
      }
    } else if (this.state.interaction === 'potential-tap') {
      if (this.props.potentialTapClassName) {
        result += ' ';
        result += this.props.potentialTapClassName;
      }
    } else if (this.state.interaction === 'potential-long-tap') {
      if (this.props.potentialLongTapClassName) {
        result += ' ';
        result += this.props.potentialLongTapClassName;
      }
    } else if (this.state.interaction === 'press-captured') {
      if (this.props.capturePressClassName) {
        result += ' ';
        result += this.props.capturePressClassName;
      }
    } else if (this.state.hovered) {
      if (this.props.hoverClassName) {
        result += ' ';
        result += this.props.hoverClassName;
      }
    }
    return result;
  };

  private determineStyle = () => {
    const { style } = this.props;
    if (this.props.disabled) {
      if (this.props.disabledStyle) {
        return { ...(style || {}), ...this.props.disabledStyle };
      }
    } else if (this.state.interaction === 'potential-tap') {
      if (this.props.potentialTapStyle) {
        return { ...(style || {}), ...this.props.potentialTapStyle };
      }
    } else if (this.state.interaction === 'potential-long-tap') {
      if (this.props.potentialLongTapStyle) {
        return { ...(style || {}), ...this.props.potentialLongTapStyle };
      }
    } else if (this.state.interaction === 'press-captured') {
      if (this.props.capturePressStyle) {
        return { ...(style || {}), ...this.props.capturePressStyle };
      }
    } else if (this.state.hovered) {
      if (this.props.hoverStyle) {
        return { ...(style || {}), ...this.props.hoverStyle };
      }
    }
    return style;
  };

  private handleCapturePressStart = (coordinates: PressEventCoordinates) => {
    this.setState({ interaction: 'press-captured' });
    this.panStartingCoordinates = coordinates;
    if (this.divRef.current) {
      this.props.onCapturePressStart?.(coordinates, this.divRef.current);
    }
  };

  private handleCapturePressMove = (coordinates: PressEventCoordinatesWithDeltas) => {
    if (this.divRef.current && this.panStartingCoordinates) {
      this.props.onCapturePressMove?.(coordinates, this.divRef.current, this.panStartingCoordinates);
    }
  };

  private handleCapturePressEnd = (coordinates: PressEventCoordinatesWithDeltas) => {
    this.setState({ interaction: undefined });
    this.panStartingCoordinates = undefined;
    if (this.divRef.current) {
      this.props.onCapturePressEnd?.(coordinates, this.divRef.current);
    }
  };

  private handleCapturePressCancelled = () => {
    this.setState({ interaction: undefined });
    this.panStartingCoordinates = undefined;
    if (this.divRef.current) {
      this.props.onCapturePressCancelled?.(this.divRef.current);
    }
  };

  private handleTapAbandoned = () => {
    this.setState({ interaction: undefined });
  };

  private handleLongTap = () => {
    this.setState({ interaction: undefined });
    this.props.onLongTap?.();
  };

  private handlePotentialLongTap = () => {
    this.setState({ interaction: 'potential-long-tap' });
  };

  private handlePotentialTap = () => {
    this.setState({ interaction: 'potential-tap' });
  };

  private handleTap = () => {
    this.setState({ interaction: undefined });
    this.props.onTap?.();
  };
}
