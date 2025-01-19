import {
	cloneElement,
	type FC,
	type ReactNode,
	type JSX,
	useState,
	useRef,
} from "react";
import {
	arrow,
	flip,
	FloatingArrow,
	offset,
	safePolygon,
	shift,
	useFloating,
	useFocus,
	useHover,
	useInteractions,
	useRole,
	useTransitionStatus,
	type FloatingArrowProps,
	type Placement,
} from "@floating-ui/react";
import { createPortal } from "react-dom";

const DEFAULT_DELAY = 125;
const DEFAULT_OFFSET = 8;
const DEFAULT_PLACEMENT = "bottom";

type TooltipProps = {
	arrowProps: Omit<FloatingArrowProps, "ref" | "context">;
	children: JSX.Element;
	content: ReactNode;
	contentClass?: string;
	delay?: number;
	interactive?: boolean;
	onClose?: () => void;
	onOpen?: () => void;
	offset?: number;
	placement?: Placement;
};

const _internalUseRef = useRef;

export const Tooltip: FC<TooltipProps> = (props) => {
	const arrowElRef = _internalUseRef(null);

	const [open, setOpen] = useState(false);

	const floating = useFloating({
		middleware: [
			offset(props.offset ?? DEFAULT_OFFSET),
			flip(),
			shift(),
			arrow({ element: arrowElRef }),
		],
		onOpenChange: (isOpen) => {
			setOpen(isOpen);

			if (!isOpen) {
				props.onClose?.();
			}

			if (isOpen) {
				props.onOpen?.();
			}
		},
		open,
		placement: props.placement ?? DEFAULT_PLACEMENT,
	});

	const transitionStatus = useTransitionStatus(floating.context);

	const interactions = useInteractions([
		useHover(floating.context, {
			handleClose: props.interactive
				? safePolygon({
						buffer: 2,
					})
				: undefined,
			restMs: props.delay ?? DEFAULT_DELAY,
		}),
		useFocus(floating.context),
		useRole(floating.context, { role: "tooltip" }),
	]);

	return (
		<>
			{cloneElement(
				props.children,
				interactions.getReferenceProps({
					...(props.children.props as Record<string, unknown>),
					ref: floating.refs.setReference,
				}),
			)}
			{transitionStatus.isMounted &&
				createPortal(
					<div
						ref={floating.refs.setFloating}
						style={floating.floatingStyles}
						{...interactions.getFloatingProps()}
						className={props.contentClass}
						hidden={!open}
					>
						{props.content}
						<FloatingArrow
							{...props.arrowProps}
							ref={arrowElRef}
							context={floating.context}
						/>
					</div>,
					floating.refs.domReference.current?.closest("dialog") ||
						document.body,
				)}
		</>
	);
};
