import * as React from 'react';

import { InteractableIdAttributeName } from './Interactable';
import { PressEventCoordinatesWithDeltas, PressHandlingOptions } from './PressInterpreter';
import { SpaceContext, SpaceContextType } from './SpaceContext';
import { generateRandomId } from './utils';
import { PressEventCoordinates } from './ViewPort';

const DEFAULT_LONG_TAP_THRESHOLD_MS: number = 500;

export const PRESSABLE_CSS_CLASS_NAME = `react-zoomable-ui-pressable`;

export interface PressableProps {
  readonly className?: string;
  readonly potentialTapClassName?: string;
  readonly potentialLongTapClassName?: string;
  readonly capturePanClassName?: string;
  // readonly disabledClassName?: string;
  readonly style?: React.CSSProperties;
  readonly potentialTapStyle?: React.CSSProperties;
  readonly potentialLongTapStyle?: React.CSSProperties;
  readonly capturePanStyle?: React.CSSProperties;
  // readonly disabledStyle?: React.CSSProperties;

  // readonly disabled?: boolean;
  readonly capturePanOn?: undefined | 'press' | 'longPress';
  readonly longTapThresholdMs?: number;

  readonly onTap?: () => void;
  readonly onLongTap?: () => void;
  readonly onCapturePanStart?: (coordinates: PressEventCoordinates, pressableUnderlyingElement: HTMLElement) => void;
  readonly onCapturePanMove?: (
    coordinates: PressEventCoordinatesWithDeltas,
    pressableUnderlyingElement: HTMLElement,
    startingCoordinates: PressEventCoordinates,
  ) => void;
  readonly onCapturePanEnd?: (
    coordinates: PressEventCoordinatesWithDeltas,
    pressableUnderlyingElement: HTMLElement,
  ) => void;
  readonly onCapturePanCancelled?: (pressableUnderlyingElement: HTMLElement) => void;
  // readonly onPressContextMenu?: () => void;
}

interface PressableState {
  readonly interactionState: undefined | 'POTENTIAL_TAP' | 'POTENTIAL_LONG_TAP' | 'CAPTURED';
}

export class Pressable extends React.PureComponent<PressableProps, PressableState> {
  public static contextType = SpaceContext;
  public readonly context!: SpaceContextType;
  public readonly id = generateRandomId();
  public readonly state: PressableState = { interactionState: undefined };

  private panStartingCoordinates?: PressEventCoordinates;
  private readonly divRef: React.RefObject<HTMLDivElement> = React.createRef();

  public componentDidMount() {
    this.context.registerInteractable(this);
  }

  public componentWillUnmount() {
    this.context.unregisterInteractable(this);
  }

  public getPressHandlingConfig(): PressHandlingOptions {
    return {
      onPotentialTap: this.handlePotentialTap,
      onTap: this.handleTap,
      longTapThresholdMs: this.props.onLongTap
        ? this.props.longTapThresholdMs ?? DEFAULT_LONG_TAP_THRESHOLD_MS
        : undefined,
      onPotentialLongTap: this.handlePotentialLongTap,
      onLongTap: this.handleLongTap,
      onTapAbandoned: this.handleTapAbandoned,
      capturePressThresholdMs:
        this.props.capturePanOn === 'press'
          ? 0
          : this.props.capturePanOn === 'longPress'
          ? this.props.longTapThresholdMs ?? DEFAULT_LONG_TAP_THRESHOLD_MS
          : undefined,
      onCapturePressStart: this.handleCapturePressStart,
      onCapturePressMove: this.handleCapturePressMove,
      onCapturePressEnd: this.handleCapturePressEnd,
      onCapturePressCancelled: this.handleCapturePressCancelled,
    };
  }

  public render() {
    const {
      className,
      potentialTapClassName,
      potentialLongTapClassName,
      capturePanClassName,
      // disabledClassName,
      style,
      potentialTapStyle: pressStyle,
      potentialLongTapStyle: longPressStyle,
      capturePanStyle,
      // disabledStyle,

      // disabled,
      capturePanOn,
      longTapThresholdMs,
      onTap,
      onLongTap,
      onCapturePanStart,
      onCapturePanMove,
      onCapturePanEnd,
      onCapturePanCancelled,
      ...divProps
    } = this.props;
    return (
      <div
        {...divProps}
        {...{ [InteractableIdAttributeName]: this.id }}
        ref={this.divRef}
        className={this.determineClassName()}
        style={this.determineStyle()}
      >
        {this.props.children}
      </div>
    );
  }

  private determineClassName = () => {
    const { className } = this.props;
    let result = PRESSABLE_CSS_CLASS_NAME;
    if (className) {
      result += ' ';
      result += className;
    }

    if (this.state.interactionState === 'POTENTIAL_TAP') {
      if (this.props.potentialTapClassName) {
        result += ' ';
        result += this.props.potentialTapClassName;
      }
    } else if (this.state.interactionState === 'POTENTIAL_LONG_TAP') {
      if (this.props.potentialLongTapClassName) {
        result += ' ';
        result += this.props.potentialLongTapClassName;
      }
    } else if (this.state.interactionState === 'CAPTURED') {
      if (this.props.capturePanClassName) {
        result += ' ';
        result += this.props.capturePanClassName;
      }
    }
    return result;
  };

  private determineStyle = () => {
    const { style } = this.props;
    if (this.state.interactionState === 'POTENTIAL_TAP') {
      if (this.props.potentialTapStyle) {
        return { ...(style || {}), ...this.props.potentialTapStyle };
      }
    } else if (this.state.interactionState === 'POTENTIAL_LONG_TAP') {
      if (this.props.potentialLongTapStyle) {
        return { ...(style || {}), ...this.props.potentialLongTapStyle };
      }
    } else if (this.state.interactionState === 'CAPTURED') {
      if (this.props.capturePanStyle) {
        return { ...(style || {}), ...this.props.capturePanStyle };
      }
    }
    return style;
  };

  private handleCapturePressStart = (coordinates: PressEventCoordinates) => {
    this.setState({ interactionState: 'CAPTURED' });
    this.panStartingCoordinates = coordinates;
    if (this.divRef.current) {
      this.props.onCapturePanStart?.(coordinates, this.divRef.current);
    }
  };

  private handleCapturePressMove = (coordinates: PressEventCoordinatesWithDeltas) => {
    if (this.divRef.current && this.panStartingCoordinates) {
      this.props.onCapturePanMove?.(coordinates, this.divRef.current, this.panStartingCoordinates);
    }
  };

  private handleCapturePressEnd = (coordinates: PressEventCoordinatesWithDeltas) => {
    this.setState({ interactionState: undefined });
    this.panStartingCoordinates = undefined;
    if (this.divRef.current) {
      this.props.onCapturePanEnd?.(coordinates, this.divRef.current);
    }
  };

  private handleCapturePressCancelled = () => {
    this.setState({ interactionState: undefined });
    this.panStartingCoordinates = undefined;
    if (this.divRef.current) {
      this.props.onCapturePanCancelled?.(this.divRef.current);
    }
  };

  private handleTapAbandoned = () => {
    this.setState({ interactionState: undefined });
  };

  private handleLongTap = () => {
    this.setState({ interactionState: undefined });
    this.props.onLongTap?.();
  };

  private handlePotentialLongTap = () => {
    this.setState({ interactionState: 'POTENTIAL_LONG_TAP' });
  };

  private handlePotentialTap = () => {
    this.setState({ interactionState: 'POTENTIAL_TAP' });
  };

  private handleTap = () => {
    this.setState({ interactionState: undefined });
    this.props.onTap?.();
  };
}
