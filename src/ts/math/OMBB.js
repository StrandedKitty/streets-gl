export function Vector(x, y)
{
    this.x = x;
    this.y = y;

    this.min = function(vec)
    {
        x = Math.min(x, vec.x);
        y = Math.min(y, vec.y);
    }

    this.max = function(vec)
    {
        x = Math.max(x, vec.x);
        y = Math.max(y, vec.y);
    }

    this.midpoint = function(vec)
    {
        return new Vector((x+vec.x)*0.5, (y+vec.y)*0.5);
    }

    this.clone = function()
    {
        return new Vector(this.x, this.y);
    }

    this.normalize = function()
    {
        var len = this.length();
        this.x /= len;
        this.y /= len;
    }

    this.normalized = function()
    {
        var vec = new Vector(this.x, this.y);
        vec.normalize();
        return vec;
    }

    this.negate = function()
    {
        this.x = -this.x;
        this.y = -this.y;
    }

    this.sqrLength = function()
    {
        return this.x * this.x + this.y * this.y;
    }

    this.length = function()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    this.scale = function(len)
    {
        this.x *= len;
        this.y *= len;
    }

    this.add = function(vec)
    {
        this.x += vec.x;
        this.y += vec.y;
    }

    this.sub = function(vec)
    {
        this.x -= vec.x;
        this.y -= vec.y;
    }

    this.diff = function(vec)
    {
        return new Vector(this.x-vec.x, this.y-vec.y);
    }

    this.distance = function(vec)
    {
        var x = this.x-vec.x;
        var y = this.y-vec.y;
        return Math.sqrt(x*x+y*y);
    }

    this.dot = function(vec)
    {
        return this.x*vec.x+this.y*vec.y;
    }

    this.equals = function(vec)
    {
        return this.x == vec.x && this.y == vec.y;
    }

    this.orthogonal = function()
    {
        return new Vector(this.y, -this.x);
    }

    this.distanceToLine = function(v0, v1)
    {
        var sqrLen = v1.diff(v0).sqrLength();
        var u = ((this.x-v0.x)*(v1.x-v0.x)+(this.y-v0.y)*(v1.y-v0.y))/sqrLen;
        var v1c = v1.diff(v0);
        v1c.scale(u);
        var pl = v0.clone();
        pl.add(v1c);
        return this.distance(pl);
    }
}

"use strict";

var ON = 0;
var LEFT = 1;
var RIGHT = 2;
var ALMOST_ZERO = 0.00001;

function GetSideOfLine(lineStart, lineEnd, point)
{
    var d = (lineEnd.x-lineStart.x)*(point.y-lineStart.y)-(lineEnd.y-lineStart.y)*(point.x-lineStart.x);
    return (d > ALMOST_ZERO ? LEFT : (d < -ALMOST_ZERO ? RIGHT : ON));
}

// returns convex hull in CW order
// (required by Rotating Calipers implementation)
export function CalcConvexHull(points)
{
    // bad input?
    if (points.length < 3)
        return points;

    // find first hull point
    var hullPt = points[0];
    var convexHull = [];

    for (var i=1; i<points.length; i++)
    {
        // perform lexicographical compare
        if (points[i].x < hullPt.x)
            hullPt = points[i];
        else if (Math.abs(points[i].x-hullPt.x) < ALMOST_ZERO) // equal
            if (points[i].y < hullPt.y)
                hullPt = points[i];
    }

    // find remaining hull points
    do
    {
        convexHull.unshift(hullPt.clone());
        var endPt = points[0];

        for (var j=1; j<points.length; j++)
        {
            var side = GetSideOfLine(hullPt, endPt, points[j]);

            // in case point lies on line take the one further away.
            // this fixes the collinearity problem.
            if (endPt.equals(hullPt) || (side == LEFT || (side == ON && hullPt.distance(points[j]) > hullPt.distance(endPt))))
                endPt = points[j];
        }

        hullPt = endPt;
    }
    while (!endPt.equals(convexHull[convexHull.length-1]));

    return convexHull;
}

function IntersectLines(start0, dir0, start1, dir1)
{
    var dd = dir0.x*dir1.y-dir0.y*dir1.x;
    // dd=0 => lines are parallel. we don't care as our lines are never parallel.
    var dx = start1.x-start0.x;
    var dy = start1.y-start0.y;
    var t = (dx*dir1.y-dy*dir1.x)/dd;
    return new Vector(start0.x+t*dir0.x, start0.y+t*dir0.y);
}

// computes the minimum area enclosing rectangle
// (aka oriented minimum bounding box)
export function ComputeOMBB(convexHull)
{
    let BestObbArea, BestObb;

    const UpdateOmbb = function(leftStart, leftDir, rightStart, rightDir, topStart, topDir, bottomStart, bottomDir)
    {
        var obbUpperLeft = IntersectLines(leftStart, leftDir, topStart, topDir);
        var obbUpperRight = IntersectLines(rightStart, rightDir, topStart, topDir);
        var obbBottomLeft = IntersectLines(bottomStart, bottomDir, leftStart, leftDir);
        var obbBottomRight = IntersectLines(bottomStart, bottomDir, rightStart, rightDir);
        var distLeftRight = obbUpperLeft.distance(obbUpperRight);
        var distTopBottom = obbUpperLeft.distance(obbBottomLeft);
        var obbArea = distLeftRight*distTopBottom;

        if (obbArea < BestObbArea)
        {
            BestObb = [obbUpperLeft, obbBottomLeft, obbBottomRight, obbUpperRight];
            BestObbArea = obbArea;
        }
    }

    // initialize attributes
    BestObbArea = Number.MAX_VALUE;
    BestObb = [];

    // compute directions of convex hull edges
    var edgeDirs = [];

    for (var i=0; i<convexHull.length; i++)
    {
        edgeDirs.push(convexHull[(i+1)%convexHull.length].diff(convexHull[i]));
        edgeDirs[i].normalize();
    }

    // compute extreme points
    var minPt = new Vector(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    var maxPt = new Vector(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    var leftIdx, rightIdx, topIdx, bottomIdx;

    for (var i=0; i<convexHull.length; i++)
    {
        var pt = convexHull[i];

        if (pt.x < minPt.x)
        {
            minPt.x = pt.x;
            leftIdx = i;
        }

        if (pt.x > maxPt.x)
        {
            maxPt.x = pt.x;
            rightIdx = i;
        }

        if (pt.y < minPt.y)
        {
            minPt.y = pt.y;
            bottomIdx = i;
        }

        if (pt.y > maxPt.y)
        {
            maxPt.y = pt.y;
            topIdx = i;
        }
    }

    // initial caliper lines + directions
    //
    //        top
    //      <-------
    //      |      A
    //      |      | right
    // left |      |
    //      V      |
    //      ------->
    //       bottom
    var leftDir = new Vector(0.0, -1);
    var rightDir = new Vector(0, 1);
    var topDir = new Vector(-1, 0);
    var bottomDir = new Vector(1, 0);

    // execute rotating caliper algorithm
    for (var i=0; i<convexHull.length; i++)
    {
        // of course the acos() can be optimized.
        // but it's a JS prototype anyways, so who cares.
        var phis = // 0=left, 1=right, 2=top, 3=bottom
            [
                Math.acos(leftDir.dot(edgeDirs[leftIdx])),
                Math.acos(rightDir.dot(edgeDirs[rightIdx])),
                Math.acos(topDir.dot(edgeDirs[topIdx])),
                Math.acos(bottomDir.dot(edgeDirs[bottomIdx])),
            ];

        var lineWithSmallestAngle = phis.indexOf(Math.min.apply(Math, phis));
        switch (lineWithSmallestAngle)
        {
            case 0: // left
                leftDir = edgeDirs[leftIdx].clone();
                rightDir = leftDir.clone();
                rightDir.negate();
                topDir = leftDir.orthogonal();
                bottomDir = topDir.clone();
                bottomDir.negate();
                leftIdx = (leftIdx+1)%convexHull.length;
                break;
            case 1: // right
                rightDir = edgeDirs[rightIdx].clone();
                leftDir = rightDir.clone();
                leftDir.negate();
                topDir = leftDir.orthogonal();
                bottomDir = topDir.clone();
                bottomDir.negate();
                rightIdx = (rightIdx+1)%convexHull.length;
                break;
            case 2: // top
                topDir = edgeDirs[topIdx].clone();
                bottomDir = topDir.clone();
                bottomDir.negate();
                leftDir = bottomDir.orthogonal();
                rightDir = leftDir.clone();
                rightDir.negate();
                topIdx = (topIdx+1)%convexHull.length;
                break;
            case 3: // bottom
                bottomDir = edgeDirs[bottomIdx].clone();
                topDir = bottomDir.clone();
                topDir.negate();
                leftDir = bottomDir.orthogonal();
                rightDir = leftDir.clone();
                rightDir.negate();
                bottomIdx = (bottomIdx+1)%convexHull.length;
                break;
        }

        UpdateOmbb(convexHull[leftIdx], leftDir, convexHull[rightIdx], rightDir, convexHull[topIdx], topDir, convexHull[bottomIdx], bottomDir);
    }

    return BestObb;
}