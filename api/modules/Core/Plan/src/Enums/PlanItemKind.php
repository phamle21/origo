<?php

namespace Origo\Core\Plan\Enums;

enum PlanItemKind: string
{
    case Phase = 'phase';
    case Module = 'module';
    case Feature = 'feature';

    /** The kind a parent must have, or null for a top-level item. */
    public function parentKind(): ?self
    {
        return match ($this) {
            self::Phase => null,
            self::Module => self::Phase,
            self::Feature => self::Module,
        };
    }
}
